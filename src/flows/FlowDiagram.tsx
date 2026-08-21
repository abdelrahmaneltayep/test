/**
 * Renders one flow as hand-authored inline SVG — no library, no runtime, no images.
 *
 * The geometry is generated rather than drawn by hand because the twenty-three flows share
 * one grid: shared baselines and even gaps are most of what makes a set of diagrams read as
 * deliberate, and eyeballing twenty-three of them would not hold that. Every node sits at
 * (col, row); every edge is an orthogonal polyline between two node edges.
 *
 * Colour is load-bearing: it says who acts at that step, so a handoff between buyer and
 * seller reads as a colour change. The one place a literal hue is reserved rather than
 * inherited is the blocked outcome, which is semantic and deliberately not an actor hue.
 */

import type { Flow, FlowNode } from './flowsData'

const COL_W = 226
const ROW_H = 118
const NODE_W = 168
const NODE_H = 66
const PAD = 14
/*
 * Wrap width is set against the *bold* weight the start, end and blocked nodes use, not
 * the regular weight — sizing to the regular weight overflows the shape on exactly the
 * nodes that matter most.
 */
const CHARS_PER_LINE = 22

/** Up to three lines at 11px inside the node. Longer than that belongs in a different node. */
function wrap(text: string): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (next.length > CHARS_PER_LINE && line) { lines.push(line); line = w } else { line = next }
  }
  if (line) lines.push(line)
  return lines.slice(0, 3)
}

const nx = (n: FlowNode) => PAD + n.col * COL_W
const ny = (n: FlowNode) => PAD + n.row * ROW_H
const cx = (n: FlowNode) => nx(n) + NODE_W / 2
const cy = (n: FlowNode) => ny(n) + NODE_H / 2

/** A hexagon reads as a decision at this size; a diamond wide enough for the text would not. */
function hexPath(x: number, y: number, w: number, h: number) {
  const c = 13
  return `M${x + c},${y} H${x + w - c} L${x + w},${y + h / 2} L${x + w - c},${y + h} H${x + c} L${x},${y + h / 2} Z`
}

export function FlowDiagram({ flow }: { flow: Flow }) {
  const maxCol = Math.max(...flow.nodes.map((n) => n.col))
  const maxRow = Math.max(...flow.nodes.map((n) => n.row))
  const width = PAD * 2 + maxCol * COL_W + NODE_W
  const loopY = PAD + maxRow * ROW_H + NODE_H + 30
  const hasLoop = flow.edges.some((e) => {
    const f = flow.nodes.find((n) => n.id === e.from)!
    const t = flow.nodes.find((n) => n.id === e.to)!
    return t.col <= f.col
  })
  const height = (hasLoop ? loopY + 16 : PAD * 2 + maxRow * ROW_H + NODE_H)
  const arrowId = `arw-${flow.id}`

  const byId = (id: string) => flow.nodes.find((n) => n.id === id)!

  return (
    <svg
      className="f-svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width} height={height}
      role="img"
      aria-label={`Flow for ${flow.id}, ${flow.title}. ${flow.caption} Steps: ${flow.nodes.map((n) => n.label).join(', then ')}.`}
    >
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,1 L9,5 L0,9 z" className="f-arrowhead" />
        </marker>
      </defs>

      {flow.edges.map((e) => {
        const f = byId(e.from)
        const t = byId(e.to)
        const backward = t.col <= f.col
        let d: string
        let labelAt: { x: number; y: number }

        if (backward) {
          // Route beneath everything so a loop never crosses a node.
          d = `M${cx(f)},${ny(f) + NODE_H} V${loopY} H${cx(t)} V${ny(t) + NODE_H}`
          labelAt = { x: (cx(f) + cx(t)) / 2, y: loopY - 6 }
        } else if (f.row === t.row) {
          d = `M${nx(f) + NODE_W},${cy(f)} H${nx(t)}`
          labelAt = { x: (nx(f) + NODE_W + nx(t)) / 2, y: cy(f) - 7 }
        } else {
          const midX = (nx(f) + NODE_W + nx(t)) / 2
          d = `M${nx(f) + NODE_W},${cy(f)} H${midX} V${cy(t)} H${nx(t)}`
          labelAt = { x: midX - 5, y: (cy(f) + cy(t)) / 2 - 5 }
        }

        return (
          <g key={`${e.from}-${e.to}`}>
            <path d={d} className="f-edge" markerEnd={`url(#${arrowId})`} fill="none" />
            {e.label && (
              <text
                x={labelAt.x} y={labelAt.y}
                className="f-edge-label"
                textAnchor={f.row === t.row || backward ? 'middle' : 'end'}
              >{e.label}</text>
            )}
          </g>
        )
      })}

      {flow.nodes.map((n) => {
        const x = nx(n), y = ny(n)
        const lines = wrap(n.label)
        const cls = `f-node f-node--${n.actor} f-node--${n.kind}`
        const textTop = n.ref
          ? cy(n) - (lines.length - 1) * 6.5 - 5
          : cy(n) - (lines.length - 1) * 6.5 + 1

        return (
          <g key={n.id} className={cls}>
            {n.kind === 'decision'
              ? <path d={hexPath(x, y, NODE_W, NODE_H)} className="f-shape" />
              : <rect
                  x={x} y={y} width={NODE_W} height={NODE_H}
                  rx={n.kind === 'start' || n.kind === 'end' || n.kind === 'stop' ? NODE_H / 2 : 9}
                  className="f-shape"
                />}
            {lines.map((ln, i) => (
              <text key={i} x={cx(n)} y={textTop + i * 13} className="f-label" textAnchor="middle">{ln}</text>
            ))}
            {n.ref && (
              <text x={cx(n)} y={textTop + lines.length * 13 + 1} className="f-ref" textAnchor="middle">{n.ref}</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
