/* About Us copy — from HIGHBASE_About_Us_Rewrite.docx (marketing, 30 Sep 2026). Section numbers follow the document;
   section 6 (Global trade) ships hidden until launch. Icons are the prototype's choice (proposal).
   trust / contact / facts carry only what the document, the live modal or the live footer already say — no figures
   or people were supplied, so none appear. */
module.exports = {
  cta: { buyer: 'Join as a Buyer', supplier: 'Join as a Supplier' },
  hero: { eyebrow: 'About HIGHBASE', title: 'The wholesale platform for the Gulf’s local trade.', lede: 'HIGHBASE connects suppliers and their business customers on one digital platform, so ordering, tracking, and reordering run smoothly without the calls, WhatsApp threads, and manual mistakes.',
    buyerLine: 'One place to order from every supplier, track deliveries, and reorder in seconds.', supplierLine: 'Take orders digitally and stay in charge of your prices and credit terms.' },
  trust: { title: 'Local trade, live today', items: [
    ['Bahrain', 'Headquartered in Seef, Kingdom of Bahrain', 'live · footer'],
    ['Gulf', 'Built for the region’s local wholesale trade', 'doc · hero'],
    ['3 steps', 'Register, review, activation — then you’re live', 'live · registration steps'],
    ['0', 'changes to your suppliers, prices and credit terms', 'doc · section 2']] },
  what: { title: 'What is HIGHBASE', question: 'What is HIGHBASE?', p1: 'HIGHBASE is a B2B wholesale platform built for real distribution workflows. Suppliers put their catalogues online and manage their customers’ orders digitally. Restaurants, cafés, and grocery stores get one place to order, track deliveries, and keep their buying organized.', p2: 'Nothing changes in your commercial relationships. Suppliers keep full control of their prices and credit terms. HIGHBASE makes the daily work around them faster and clearer.' },
  who: { title: 'Who it’s for', items: [['store', 'Grocery stores and mini-markets'], ['team', 'Restaurants, cafés, and catering businesses'], ['building', 'Hotels and food service operators'], ['dashboard', 'Office managements'], ['truck', 'Suppliers, distributors, and wholesalers', 'who want to digitize how they take and manage orders']] },
  how: { title: 'How it works', lede: 'Three steps on each side of the trade.',
    buyers: { title: 'For buyers', steps: [['Register.', 'Create your business account in minutes.'], ['Order digitally.', 'Browse catalogues, place orders, and reorder regular items in seconds.'], ['Stay in control.', 'Track order and delivery status, and keep your full order history in one place.']] },
    suppliers: { title: 'For suppliers (distributors / manufacturers)', steps: [['Register.', 'Create your business account and set up your company profile.'], ['Add your product catalogue.', 'Upload your products, prices, and details so buyers can browse and order.'], ['Manage orders.', 'Receive, confirm, and track orders and deliveries from one dashboard.']] },
    nodes: ['Register', 'Order', 'Track'] },
  both: { title: 'Built for both sides of the trade',
    buyers: { icon: 'cart', title: 'For buyers', lede: 'Manage all your wholesale suppliers in one place.', items: ['View every supplier’s catalog in one place', 'Reorder regular items in seconds', 'Track orders and deliveries', 'Cut down on calls, WhatsApp messages, and ordering mistakes', 'Keep your existing suppliers, prices, and credit terms'] },
    suppliers: { icon: 'store', title: 'For suppliers', lede: 'Take orders digitally and stay in charge of your business.', items: ['Bring your customers onto one ordering system', 'Receive clear, accurate orders instead of scattered messages', 'Keep full control of pricing and credit terms', 'Connect customers instantly with QR or NFC on your next visit'] },
    note: 'Marketing’s note: the supplier-side copy was written from context because the “Sell Locally” tab was not in the screenshots. Verify it against the current site.' },
  global: { badge: 'Coming soon', title: 'Global trade', lede: 'HIGHBASE is expanding beyond local wholesale into international trade across the Gulf and worldwide, through the same platform.',
    buy: { title: 'Buy globally', text: 'Discover international brands, distributors, and manufacturers. Browse detailed catalogs, request quotes, and connect directly with suppliers to build partnerships and streamline imports. The platform supports packaged consumer goods and fresh produce across many sectors.' },
    sell: { title: 'Sell globally', text: 'Find the right international distributor for your product category and reach new customers in new regions, from where you already operate. Control your brand’s product data, images, and content quality, and tailor your content to different languages and markets.' } },
  /* [icon, title, text, concrete fact from the document] */
  why: { title: 'Why HIGHBASE', items: [
    ['dashboard', 'Built for real workflows', 'Designed around how distribution actually works, not around a generic online store.', 'Catalogues online, orders managed digitally'],
    ['check', 'No disruption', 'Existing relationships, prices, and credit terms stay exactly as they are.', 'Suppliers keep full control of prices and credit terms'],
    ['clock', 'Less friction', 'Fewer calls, fewer errors, faster reordering.', 'Reorder regular items in seconds'],
    ['view', 'Clear visibility', 'Every order and delivery tracked in one place.', 'Order and delivery status, full history in one place']] },
  final: { title: 'Ready to run wholesale smarter?', lede: 'Local trade is live today. Create your business account and bring your suppliers or your customers onto one platform.' },
  contact: { eyebrow: 'Contact', title: 'Find us in Bahrain', company: 'HIGHBASE TRADING W.L.L', address: 'Road 2845, Seef, Kingdom of Bahrain', phone: '+973-13300833', email: 'info@highbaseco.com', message: 'Leave us a message' },
  /* sample catalogue rows for the product-led hero (prototype sample data, not live) */
  sample: [['Sunflower oil 5 L · case of 4', 'Al Manar Foods', '18.900'], ['Basmati rice 20 kg', 'Gulf Grain Co.', '9.750'], ['Paper cups 8 oz · 1,000', 'Seef Packaging', '12.400'], ['Tomato paste 800 g · case of 12', 'Al Manar Foods', '7.200']]
};
