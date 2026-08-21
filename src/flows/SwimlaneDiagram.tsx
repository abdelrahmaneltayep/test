/**
 * Vertical swimlane renderer for the two master flows.
 *
 * Three lanes — Buyer, System, Seller — and the lane a node sits in is who acts, so a
 * handoff is a lane crossing rather than something to read. Colour repeats that encoding
 * for anyone scanning a single node out of context.
 *
 * Geometry is generated so the whole diagram sits on one grid: two parallel tracks per
 * lane for branches that run alongside each other, a fixed row pitch, and orthogonal edges
 * that leave a node's bottom and enter the next one's top. Loops back up the flow exit
 * left and travel in a reserved gutter, so they never cross a node.
 */

import type { LaneEdge, LaneNode, MasterFlow } from './masterFlows'
import { LANE_ACTORS, LANE_NAMES } from './masterFlows'

const GUTTER = 46
const LANE_W = 372
const SLOT_PITCH = 186
const NODE_W = 168
const NODE_H = 64
const ROW_H = 98
const HEADER_H = 34
const PAD = 16
const CHARS_PER_LINE = 22

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

const nx = (n: LaneNode) => GUTTER + n.lane * LANE_W + n.slot * SLOT_PITCH
const ny = (n: LaneNode) => HEADER_H + PAD + n.row * ROW_H
const cxOf = (n: LaneNode) => nx(n) + NODE_W / 2
const cyOf = (n: LaneNode) => ny(n) + NODE_H / 2

function hexPath(x: number, y: number, w: number, h: number) {
  const c = 13
  return `M${x + c},${y} H${x + w - c} L${x + w},${y + h / 2} L${x + w - c},${y + h} H${x + c} L${x},${y + h / 2} Z`
}

export function SwimlaneDiagram({ flow }: { flow: MasterFlow }) {
  const maxRow = Math.max(...flow.nodes.map((n) => n.row))
  const width = GUTTER + 3 * LANE_W - (LANE_W - SLOT_PITCH - NODE_W) + PAD
  const height = HEADER_H + PAD * 2 + maxRow * ROW_H + NODE_H
  const arrowId = `sw-arw-${flow.id}`
  const byId = (id: string) => flow.nodes.find((n) => n.id === id)!

  /*
   * Several branches converge on the same node — "still purchasable at list price" takes
   * four. Without a per-edge offset their horizontal runs stack on one line and read as a
   * single arrow, so each incoming edge gets its own band.
   */
  const incomingIndex = new Map<string, number>()
  const seen: Record<string, number> = {}
  for (const e of flow.edges) {
    seen[e.to] = (seen[e.to] ?? 0) + 1
    incomingIndex.set(`${e.from}->${e.to}`, seen[e.to] - 1)
  }

  function edgePath(e: LaneEdge) {
    const s = byId(e.from)
    const t = byId(e.to)
    const k = incomingIndex.get(`${e.from}->${e.to}`) ?? 0

    if (t.row <= s.row) {
      // Backward: out the left, up the reserved gutter, back in the left.
      const gx = 16 + (k % 3) * 8
      return {
        d: `M${nx(s)},${cyOf(s)} H${gx} V${cyOf(t)} H${nx(t)}`,
        label: { x: gx + 6, y: (cyOf(s) + cyOf(t)) / 2, anchor: 'start' as const },
      }
    }
    if (nx(s) === nx(t)) {
      return {
        d: `M${cxOf(s)},${ny(s) + NODE_H} V${ny(t)}`,
        label: { x: cxOf(s) + 7, y: (ny(s) + NODE_H + ny(t)) / 2 + 3, anchor: 'start' as const },
      }
    }
    const midY = ny(t) - 22 - k * 9
    return {
      d: `M${cxOf(s)},${ny(s) + NODE_H} V${midY} H${cxOf(t)} V${ny(t)}`,
      label: { x: (cxOf(s) + cxOf(t)) / 2, y: midY - 5, anchor: 'middle' as const },
    }
  }

  return (
    <svg
      className="f-svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width} height={height}
      role="img"
      aria-label={`${flow.title}. ${flow.caption} The diagram has three lanes — buyer, system and seller — and runs top to bottom through ${flow.nodes.length} steps.`}
    >
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,1 L9,5 L0,9 z" className="f-arrowhead" />
        </marker>
      </defs>

      {/* Lane bands and headers — the lane is the actor, so it is labelled once at the top. */}
      {LANE_NAMES.map((name, i) => {
        const x = GUTTER + i * LANE_W - 12
        const w = i === 2 ? SLOT_PITCH + NODE_W + 24 : LANE_W
        return (
          <g key={name} className={`f-lane f-lane--${LANE_ACTORS[i]}`}>
            <rect x={x} y={0} width={w} height={height} className="f-lane-band" />
            <rect x={x} y={0} width={w} height={HEADER_H} className="f-lane-head" />
            <text x={x + 14} y={HEADER_H / 2 + 4} className="f-lane-label">{name}</text>
          </g>
        )
      })}

      {flow.edges.map((e) => {
        const { d, label } = edgePath(e)
        return (
          <g key={`${e.from}-${e.to}`}>
            <path d={d} className="f-edge" markerEnd={`url(#${arrowId})`} fill="none" />
            {e.label && <text x={label.x} y={label.y} className="f-edge-label" textAnchor={label.anchor}>{e.label}</text>}
          </g>
        )
      })}

      {flow.nodes.map((n) => {
        const x = nx(n), y = ny(n)
        const lines = wrap(n.label)
        const textTop = n.ref
          ? cyOf(n) - (lines.length - 1) * 6.5 - 5
          : cyOf(n) - (lines.length - 1) * 6.5 + 1
        return (
          <g key={n.id} className={`f-node f-node--${n.actor} f-node--${n.kind}`}>
            {n.kind === 'decision'
              ? <path d={hexPath(x, y, NODE_W, NODE_H)} className="f-shape" />
              : <rect
                  x={x} y={y} width={NODE_W} height={NODE_H}
                  rx={n.kind === 'start' || n.kind === 'end' || n.kind === 'stop' ? NODE_H / 2 : 9}
                  className="f-shape"
                />}
            {lines.map((ln, i) => (
              <text key={i} x={cxOf(n)} y={textTop + i * 13} className="f-label" textAnchor="middle">{ln}</text>
            ))}
            {n.ref && <text x={cxOf(n)} y={textTop + lines.length * 13 + 1} className="f-ref" textAnchor="middle">{n.ref}</text>}
          </g>
        )
      })}
    </svg>
  )
}
