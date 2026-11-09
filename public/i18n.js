'use strict';
/*
 * Translations. Hebrew is the source language: each key below is the Hebrew text used in the code,
 * so a text with no translation simply shows in Hebrew. {name} marks a value filled in by the code.
 * Plural forms use P(one, other).
 */
const LANGS = [
  { code: 'he', name: 'עברית', dir: 'rtl' },
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'ja', name: '日本語', dir: 'ltr' },
  { code: 'zh', name: '中文', dir: 'ltr' },
];
const YMD_FIRST = new Set(['ja', 'zh']);
const P = (one, other) => ({ one, other });

const I18N = {
  // Page
  'מעקב תיק קלפים': { en: 'Card Portfolio Tracker', es: 'Seguimiento de cartera de cartas', fr: 'Suivi du portefeuille de cartes', ja: 'カードポートフォリオ管理', zh: '卡牌投资组合追踪' },
  'שפה': { en: 'Language', es: 'Idioma', fr: 'Langue', ja: '言語', zh: '语言' },
  'בחירת תיק': { en: 'Choose portfolio', es: 'Elegir cartera', fr: 'Choisir un portefeuille', ja: 'ポートフォリオを選択', zh: '选择投资组合' },
  'ניהול תיקים': { en: 'Manage portfolios', es: 'Gestionar carteras', fr: 'Gérer les portefeuilles', ja: 'ポートフォリオ管理', zh: '管理投资组合' },
  'מחירי מדורגים': { en: 'Graded prices', es: 'Precios de graduadas', fr: 'Prix des cartes gradées', ja: '鑑定カード価格', zh: '评级卡价格' },
  'רענון מהיר': { en: 'Quick refresh', es: 'Actualización rápida', fr: 'Actualisation rapide', ja: 'クイック更新', zh: '快速刷新' },
  'סנכרון מלא': { en: 'Full sync', es: 'Sincronización completa', fr: 'Synchronisation complète', ja: '完全同期', zh: '完整同步' },
  'נתונים עיקריים': { en: 'Key figures', es: 'Datos principales', fr: 'Chiffres clés', ja: '主要データ', zh: '关键数据' },
  'עלות מול שווי': { en: 'Cost vs. value', es: 'Coste frente a valor', fr: 'Coût et valeur', ja: 'コストと評価額', zh: '成本与价值' },
  'תצוגת גרף שווי': { en: 'Value chart view', es: 'Vista del gráfico de valor', fr: 'Affichage du graphique de valeur', ja: '評価額グラフの表示', zh: '价值图表视图' },
  'מוצרים שהוזנו': { en: 'Entered products', es: 'Productos introducidos', fr: 'Produits saisis', ja: '入力済みの商品', zh: '已录入产品' },
  'כל התיק': { en: 'Whole portfolio', es: 'Toda la cartera', fr: 'Tout le portefeuille', ja: 'ポートフォリオ全体', zh: '整个投资组合' },
  'מה הזיז את הרווח': { en: 'What moved the profit', es: 'Qué movió la ganancia', fr: 'Ce qui a fait varier le gain', ja: '損益の要因', zh: '盈亏来源' },
  'אילו מוצרים להציג': { en: 'Which products to show', es: 'Qué productos mostrar', fr: 'Produits à afficher', ja: '表示する商品', zh: '显示哪些产品' },
  'כל המוצרים': { en: 'All products', es: 'Todos los productos', fr: 'Tous les produits', ja: 'すべての商品', zh: '所有产品' },
  'פריטים שהוזנו': { en: 'Entered items', es: 'Artículos introducidos', fr: 'Articles saisis', ja: '入力済みのアイテム', zh: '已录入项目' },
  'שער דולר יציג ורכישות': { en: 'Official dollar rate and purchases', es: 'Tipo oficial del dólar y compras', fr: 'Taux officiel du dollar et achats', ja: 'ドル公表レートと購入', zh: '美元官方汇率与购买记录' },
  'טווח זמן': { en: 'Time range', es: 'Periodo', fr: 'Période', ja: '期間', zh: '时间范围' },
  '3 חודשים': { en: '3 months', es: '3 meses', fr: '3 mois', ja: '3か月', zh: '3个月' },
  'שנה': { en: '1 year', es: '1 año', fr: '1 an', ja: '1年', zh: '1年' },
  '5 שנים': { en: '5 years', es: '5 años', fr: '5 ans', ja: '5年', zh: '5年' },
  'המוצרים בתיק': { en: 'Products in the portfolio', es: 'Productos de la cartera', fr: 'Produits du portefeuille', ja: 'ポートフォリオの商品', zh: '投资组合中的产品' },
  'המוצרים בתיק {name}': { en: 'Products in {name}', es: 'Productos de {name}', fr: 'Produits de {name}', ja: '{name} の商品', zh: '{name} 中的产品' },
  'חיפוש לפי שם או סט': { en: 'Search by name or set', es: 'Buscar por nombre o set', fr: 'Rechercher par nom ou série', ja: '名前またはセットで検索', zh: '按名称或系列搜索' },
  'חיפוש מוצר': { en: 'Search products', es: 'Buscar producto', fr: 'Rechercher un produit', ja: '商品を検索', zh: '搜索产品' },
  'סינון לפי עלות': { en: 'Filter by cost', es: 'Filtrar por coste', fr: 'Filtrer par coût', ja: 'コストで絞り込み', zh: '按成本筛选' },
  'ללא עלות': { en: 'No cost', es: 'Sin coste', fr: 'Sans coût', ja: 'コスト未入力', zh: '无成本' },
  'עם עלות': { en: 'With cost', es: 'Con coste', fr: 'Avec coût', ja: 'コスト入力済み', zh: '有成本' },
  'חדשים': { en: 'New', es: 'Nuevos', fr: 'Nouveaux', ja: '新着', zh: '新增' },
  'הוסרו מהתיק': { en: 'Removed from portfolio', es: 'Eliminados de la cartera', fr: 'Retirés du portefeuille', ja: 'ポートフォリオから削除済み', zh: '已移出投资组合' },
  'סינון לפי סוג': { en: 'Filter by type', es: 'Filtrar por tipo', fr: 'Filtrer par type', ja: '種類で絞り込み', zh: '按类型筛选' },
  'קלפים ומארזים': { en: 'Cards and sealed', es: 'Cartas y sellados', fr: 'Cartes et scellés', ja: 'カードと未開封品', zh: '卡牌和未拆封产品' },
  'קלפים': { en: 'Cards', es: 'Cartas', fr: 'Cartes', ja: 'カード', zh: '卡牌' },
  'מארזים סגורים': { en: 'Sealed products', es: 'Productos sellados', fr: 'Produits scellés', ja: '未開封品', zh: '未拆封产品' },
  'מדורגים': { en: 'Graded', es: 'Graduadas', fr: 'Gradées', ja: '鑑定済み', zh: '评级卡' },

  // Table
  'מוצר': { en: 'Product', es: 'Producto', fr: 'Produit', ja: '商品', zh: '产品' },
  'כמות': { en: 'Qty', es: 'Cantidad', fr: 'Qté', ja: '数量', zh: '数量' },
  'מחיר נוכחי': { en: 'Current price', es: 'Precio actual', fr: 'Prix actuel', ja: '現在価格', zh: '当前价格' },
  'שינוי ב-Collectr': { en: 'Change on Collectr', es: 'Cambio en Collectr', fr: 'Variation sur Collectr', ja: 'Collectrでの変動', zh: 'Collectr 涨跌' },
  'שווי היום': { en: 'Value today', es: 'Valor hoy', fr: 'Valeur actuelle', ja: '現在の評価額', zh: '当前价值' },
  'שולם': { en: 'Paid', es: 'Pagado', fr: 'Payé', ja: '支払額', zh: '已付' },
  'שער קנייה': { en: 'Purchase rate', es: 'Tipo de compra', fr: 'Taux d’achat', ja: '購入時レート', zh: '购买汇率' },
  'רווח או הפסד': { en: 'Profit or loss', es: 'Ganancia o pérdida', fr: 'Gain ou perte', ja: '損益', zh: '盈亏' },
  'פעולה': { en: 'Action', es: 'Acción', fr: 'Action', ja: '操作', zh: '操作' },
  'אין מוצרים שמתאימים לסינון.': { en: 'No products match the filter.', es: 'Ningún producto coincide con el filtro.', fr: 'Aucun produit ne correspond au filtre.', ja: '条件に一致する商品はありません。', zh: '没有符合筛选条件的产品。' },
  'עדיין אין מוצרים. בצע סנכרון מלא כדי לטעון את תיק Main.': { en: 'No products yet. Run a full sync to load the Main portfolio.', es: 'Aún no hay productos. Haz una sincronización completa para cargar la cartera Main.', fr: 'Aucun produit pour l’instant. Lancez une synchronisation complète pour charger le portefeuille Main.', ja: '商品はまだありません。完全同期を実行して Main ポートフォリオを読み込んでください。', zh: '还没有产品。请执行完整同步以加载 Main 投资组合。' },
  'מארז סגור': { en: 'Sealed product', es: 'Producto sellado', fr: 'Produit scellé', ja: '未開封品', zh: '未拆封产品' },
  'הוזן {done}/{qty}': { en: 'Entered {done}/{qty}', es: 'Introducido {done}/{qty}', fr: 'Saisi {done}/{qty}', ja: '入力済み {done}/{qty}', zh: '已录入 {done}/{qty}' },
  'חדש': { en: 'New', es: 'Nuevo', fr: 'Nouveau', ja: '新着', zh: '新' },
  'הוסר מהתיק': { en: 'Removed', es: 'Eliminado', fr: 'Retiré', ja: '削除済み', zh: '已移出' },
  'ללא שינוי': { en: 'No change', es: 'Sin cambios', fr: 'Stable', ja: '変動なし', zh: '无变化' },
  'רכישות': { en: 'Purchases', es: 'Compras', fr: 'Achats', ja: '購入履歴', zh: '购买记录' },
  'הזנת קנייה': { en: 'Add purchase', es: 'Añadir compra', fr: 'Saisir un achat', ja: '購入を入力', zh: '录入购买' },

  // Time
  'הרגע': { en: 'just now', es: 'ahora mismo', fr: 'à l’instant', ja: 'たった今', zh: '刚刚' },
  'לפני {n} דקות': { en: '{n} minutes ago', es: 'hace {n} minutos', fr: 'il y a {n} minutes', ja: '{n}分前', zh: '{n}分钟前' },
  'לפני שעה': { en: 'an hour ago', es: 'hace una hora', fr: 'il y a une heure', ja: '1時間前', zh: '1小时前' },
  'לפני {n} שעות': { en: '{n} hours ago', es: 'hace {n} horas', fr: 'il y a {n} heures', ja: '{n}時間前', zh: '{n}小时前' },
  'אתמול': { en: 'yesterday', es: 'ayer', fr: 'hier', ja: '昨日', zh: '昨天' },
  'לפני {n} ימים': { en: '{n} days ago', es: 'hace {n} días', fr: 'il y a {n} jours', ja: '{n}日前', zh: '{n}天前' },

  // Status line and banners
  'סנכרון מלא {when}': { en: 'Full sync {when}', es: 'Sincronización completa: {when}', fr: 'Synchronisation complète : {when}', ja: '完全同期: {when}', zh: '完整同步:{when}' },
  'בדיקה מהירה זמינה רק לתיק הראשי של הפרופיל': { en: 'Quick check is only available for the profile’s main portfolio', es: 'La comprobación rápida solo está disponible para la cartera principal del perfil', fr: 'La vérification rapide n’est disponible que pour le portefeuille principal du profil', ja: 'クイックチェックはプロフィールのメインポートフォリオでのみ利用できます', zh: '快速检查仅适用于个人资料的主投资组合' },
  'בדיקה מהירה {when}': { en: 'Quick check {when}', es: 'Comprobación rápida: {when}', fr: 'Vérification rapide : {when}', ja: 'クイックチェック: {when}', zh: '快速检查:{when}' },
  'מדורגים לפי מכירות: {done}/{total}': { en: 'Graded priced by sales: {done}/{total}', es: 'Graduadas según ventas: {done}/{total}', fr: 'Gradées selon les ventes : {done}/{total}', ja: '販売実績で評価した鑑定カード: {done}/{total}', zh: '按成交价估值的评级卡:{done}/{total}' },
  'ממתין לסנכרון ראשון': { en: 'Waiting for the first sync', es: 'Esperando la primera sincronización', fr: 'En attente de la première synchronisation', ja: '最初の同期を待っています', zh: '等待首次同步' },
  'כדי לטעון את כל המוצרים מהתיק {name} צריך סנכרון ראשון.': { en: 'To load all products from {name}, run a first sync.', es: 'Para cargar todos los productos de {name}, haz una primera sincronización.', fr: 'Pour charger tous les produits de {name}, lancez une première synchronisation.', ja: '{name} のすべての商品を読み込むには、最初の同期が必要です。', zh: '要加载 {name} 中的所有产品,请先执行首次同步。' },
  'איך מסנכרנים': { en: 'How to sync', es: 'Cómo sincronizar', fr: 'Comment synchroniser', ja: '同期の方法', zh: '如何同步' },
  'התיק ב-Collectr השתנה מאז הסנכרון האחרון. סנכרון מלא יעדכן את כל המוצרים.': { en: 'The portfolio on Collectr has changed since the last sync. A full sync will update all products.', es: 'La cartera en Collectr ha cambiado desde la última sincronización. Una sincronización completa actualizará todos los productos.', fr: 'Le portefeuille sur Collectr a changé depuis la dernière synchronisation. Une synchronisation complète mettra à jour tous les produits.', ja: '前回の同期以降、Collectr のポートフォリオが変更されました。完全同期ですべての商品を更新します。', zh: 'Collectr 上的投资组合自上次同步后已发生变化。完整同步将更新所有产品。' },
  'מוצר חדש אחד ממתין להזנת סכום קנייה.': { en: 'One new product is waiting for a purchase amount.', es: 'Un producto nuevo está pendiente de importe de compra.', fr: 'Un nouveau produit attend un montant d’achat.', ja: '新しい商品1点の購入金額が未入力です。', zh: '有 1 个新产品等待录入购买金额。' },
  '{n} מוצרים חדשים ממתינים להזנת סכום קנייה.': { en: '{n} new products are waiting for a purchase amount.', es: '{n} productos nuevos están pendientes de importe de compra.', fr: '{n} nouveaux produits attendent un montant d’achat.', ja: '新しい商品{n}点の購入金額が未入力です。', zh: '有 {n} 个新产品等待录入购买金额。' },
  'הצג': { en: 'Show', es: 'Mostrar', fr: 'Afficher', ja: '表示', zh: '显示' },
  'לא הצלחתי לטעון שערים מבנק ישראל: {msg}': { en: 'Could not load rates from the Bank of Israel: {msg}', es: 'No se pudieron cargar los tipos del Banco de Israel: {msg}', fr: 'Impossible de charger les taux de la Banque d’Israël : {msg}', ja: 'イスラエル銀行からレートを読み込めませんでした: {msg}', zh: '无法从以色列银行加载汇率:{msg}' },
  'הבדיקה המהירה נכשלה: {msg}': { en: 'Quick check failed: {msg}', es: 'La comprobación rápida ha fallado: {msg}', fr: 'La vérification rapide a échoué : {msg}', ja: 'クイックチェックに失敗しました: {msg}', zh: '快速检查失败:{msg}' },
  'פרטים': { en: 'Details', es: 'Detalles', fr: 'Détails', ja: '詳細', zh: '详情' },

  // KPIs
  'שווי כל התיק היום': { en: 'Portfolio value today', es: 'Valor de la cartera hoy', fr: 'Valeur du portefeuille aujourd’hui', ja: '現在のポートフォリオ評価額', zh: '投资组合当前价值' },
  '{usd} לפי Collectr': { en: '{usd} on Collectr', es: '{usd} según Collectr', fr: '{usd} selon Collectr', ja: 'Collectr では {usd}', zh: 'Collectr 价格 {usd}' },
  '{n} פריטים': { en: P('{n} item', '{n} items'), es: P('{n} artículo', '{n} artículos'), fr: P('{n} article', '{n} articles'), ja: '{n}点', zh: '{n} 件' },
  'ממתין לנתונים': { en: 'Waiting for data', es: 'Esperando datos', fr: 'En attente de données', ja: 'データ待ち', zh: '等待数据' },
  'שילמת על מוצרים שהוזנו': { en: 'Paid for entered products', es: 'Pagado por productos introducidos', fr: 'Payé pour les produits saisis', ja: '入力済み商品の支払額', zh: '已录入产品的支付金额' },
  '≈ {usd} לפי שער יום הקנייה · שווים היום {value}': { en: '≈ {usd} at purchase-day rates · worth {value} today', es: '≈ {usd} al tipo del día de compra · valen {value} hoy', fr: '≈ {usd} au taux du jour d’achat · valeur actuelle {value}', ja: '購入日のレートで約 {usd} · 現在の評価額 {value}', zh: '按购买日汇率约 {usd} · 当前价值 {value}' },
  'הוזנו {done} מתוך {total} מוצרים': { en: '{done} of {total} products entered', es: '{done} de {total} productos introducidos', fr: '{done} produits saisis sur {total}', ja: '{total}点中{done}点を入力済み', zh: '已录入 {done}/{total} 个产品' },
  '{pct} על {done} מתוך {total} מוצרים שהוזנו': { en: '{pct} on {done} of {total} products entered', es: '{pct} en {done} de {total} productos introducidos', fr: '{pct} sur {done} produits saisis sur {total}', ja: '入力済み {done}/{total} 点で {pct}', zh: '已录入的 {done}/{total} 个产品:{pct}' },
  'יוצג אחרי הזנת סכום קנייה': { en: 'Shown after you enter a purchase amount', es: 'Se muestra al introducir un importe de compra', fr: 'Affiché après la saisie d’un montant d’achat', ja: '購入金額を入力すると表示されます', zh: '录入购买金额后显示' },
  'שער דולר יציג': { en: 'Official dollar rate', es: 'Tipo oficial del dólar', fr: 'Taux officiel du dollar', ja: 'ドル公表レート', zh: '美元官方汇率' },
  'שער קנייה ממוצע {rate}': { en: 'average purchase rate {rate}', es: 'tipo medio de compra {rate}', fr: 'taux d’achat moyen {rate}', ja: '平均購入レート {rate}', zh: '平均购买汇率 {rate}' },
  'טוען מבנק ישראל': { en: 'Loading from the Bank of Israel', es: 'Cargando del Banco de Israel', fr: 'Chargement depuis la Banque d’Israël', ja: 'イスラエル銀行から読み込み中', zh: '正在从以色列银行加载' },

  // Charts
  'רכישה': { en: 'Purchase', es: 'Compra', fr: 'Achat', ja: '購入', zh: '购买' },
  'הצגה כטבלה': { en: 'Show as table', es: 'Ver como tabla', fr: 'Afficher en tableau', ja: '表で表示', zh: '以表格显示' },
  'תאריך': { en: 'Date', es: 'Fecha', fr: 'Date', ja: '日付', zh: '日期' },
  'שווי כל התיק בשקלים': { en: 'Portfolio value in shekels', es: 'Valor de la cartera en séqueles', fr: 'Valeur du portefeuille en shekels', ja: 'ポートフォリオ評価額(シェケル)', zh: '投资组合价值(谢克尔)' },
  'הגרף יופיע אחרי הסנכרון הראשון.': { en: 'The chart will appear after the first sync.', es: 'El gráfico aparecerá tras la primera sincronización.', fr: 'Le graphique apparaîtra après la première synchronisation.', ja: 'グラフは最初の同期後に表示されます。', zh: '图表将在首次同步后显示。' },
  'שווי התיק': { en: 'Portfolio value', es: 'Valor cartera', fr: 'Valeur totale', ja: '総評価額', zh: '组合价值' },
  'הזן סכום קנייה למוצר, והגרף יתחיל להשוות בין מה ששילמת לשווי היום.': { en: 'Enter a purchase amount for a product, and the chart will compare what you paid with today’s value.', es: 'Introduce un importe de compra y el gráfico comparará lo que pagaste con el valor actual.', fr: 'Saisissez un montant d’achat et le graphique comparera ce que vous avez payé à la valeur actuelle.', ja: '商品の購入金額を入力すると、支払額と現在の評価額を比較できます。', zh: '录入产品的购买金额后,图表将比较已付金额与当前价值。' },
  'הרכישות שהוזנו מתוארכות אחרי הסנכרון האחרון. הגרף יתעדכן בסנכרון הבא.': { en: 'The entered purchases are dated after the last sync. The chart will update on the next sync.', es: 'Las compras introducidas son posteriores a la última sincronización. El gráfico se actualizará en la próxima.', fr: 'Les achats saisis sont postérieurs à la dernière synchronisation. Le graphique sera mis à jour à la prochaine.', ja: '入力した購入日は前回の同期より後です。次回の同期でグラフが更新されます。', zh: '已录入的购买日期晚于上次同步。图表将在下次同步时更新。' },
  'שווי לאורך זמן בשקלים': { en: 'Value over time in shekels', es: 'Valor a lo largo del tiempo en séqueles', fr: 'Valeur dans le temps en shekels', ja: '評価額の推移(シェケル)', zh: '价值随时间变化(谢克尔)' },
  'זו נקודת הנתונים הראשונה. Collectr מציג רק מחיר נוכחי, ולכן הגרף יתמלא עם כל יום שבו האפליקציה מתעדכנת.': { en: 'This is the first data point. Collectr only shows the current price, so the chart fills in with each day the app updates.', es: 'Este es el primer dato. Collectr solo muestra el precio actual, así que el gráfico se completará cada día que se actualice la aplicación.', fr: 'C’est le premier point de données. Collectr n’affiche que le prix actuel : le graphique se remplira chaque jour où l’application se met à jour.', ja: 'これは最初のデータです。Collectr は現在価格のみを表示するため、アプリが更新されるたびにグラフが増えていきます。', zh: '这是第一个数据点。Collectr 只显示当前价格,因此图表会随应用每天更新而逐渐完整。' },
  'כאן תראה כמה מהרווח או ההפסד נובע ממחיר הקלפים וכמה משינוי שער הדולר.': { en: 'Here you’ll see how much of the profit or loss comes from card prices and how much from the dollar rate.', es: 'Aquí verás cuánta ganancia o pérdida se debe al precio de las cartas y cuánta al tipo del dólar.', fr: 'Vous verrez ici la part du gain ou de la perte due au prix des cartes et celle due au taux du dollar.', ja: '損益のうち、カード価格とドルレートの変動による割合をここに表示します。', zh: '这里将显示盈亏中有多少来自卡牌价格、多少来自美元汇率变化。' },
  'מחיר קלפים': { en: 'Card prices', es: 'Precio cartas', fr: 'Prix cartes', ja: 'カード価格', zh: '卡牌价格' },
  'שער דולר': { en: 'Dollar rate', es: 'Tipo dólar', fr: 'Taux dollar', ja: 'ドルレート', zh: '美元汇率' },
  'הרווח {pnl} מחושב רק על פריטים שהוזנו. למוצרים ללא עלות ידועה מוצג השווי בלבד.': { en: 'The {pnl} profit counts entered items only. Products with no known cost show value only.', es: 'La ganancia de {pnl} solo incluye artículos introducidos. Los productos sin coste conocido solo muestran su valor.', fr: 'Le gain de {pnl} ne compte que les articles saisis. Les produits sans coût connu n’affichent que leur valeur.', ja: '損益 {pnl} は入力済みのアイテムのみで計算しています。コスト不明の商品は評価額のみ表示します。', zh: '盈亏 {pnl} 仅按已录入项目计算。成本未知的产品只显示价值。' },
  'פירוק הרווח: שולם, השפעת מחיר הקלפים, השפעת שער הדולר, שווי היום': { en: 'Profit breakdown: paid, card price effect, dollar rate effect, value today', es: 'Desglose de la ganancia: pagado, efecto del precio de las cartas, efecto del tipo del dólar, valor hoy', fr: 'Décomposition du gain : payé, effet du prix des cartes, effet du taux du dollar, valeur actuelle', ja: '損益の内訳: 支払額、カード価格の影響、ドルレートの影響、現在の評価額', zh: '盈亏分解:已付、卡牌价格影响、美元汇率影响、当前价值' },
  'טוען שערים מבנק ישראל…': { en: 'Loading rates from the Bank of Israel…', es: 'Cargando tipos del Banco de Israel…', fr: 'Chargement des taux de la Banque d’Israël…', ja: 'イスラエル銀行からレートを読み込み中…', zh: '正在从以色列银行加载汇率…' },
  'אין שערים לטווח הזה.': { en: 'No rates for this range.', es: 'No hay tipos para este periodo.', fr: 'Aucun taux pour cette période.', ja: 'この期間のレートはありません。', zh: '此时间范围内没有汇率。' },
  'שער יציג': { en: 'Official rate', es: 'Tipo oficial', fr: 'Taux officiel', ja: '公表レート', zh: '官方汇率' },
  'שער דולר יציג לאורך זמן': { en: 'Official dollar rate over time', es: 'Tipo oficial del dólar a lo largo del tiempo', fr: 'Taux officiel du dollar dans le temps', ja: 'ドル公表レートの推移', zh: '美元官方汇率走势' },

  // Purchases
  '{qty} יח׳ · {paid} · שער {rate}': { en: '{qty} pcs · {paid} · rate {rate}', es: '{qty} uds. · {paid} · tipo {rate}', fr: '{qty} pièces · {paid} · taux {rate}', ja: '{qty}点 · {paid} · レート {rate}', zh: '{qty} 件 · {paid} · 汇率 {rate}' },
  'רכישות שהוזנו': { en: 'Entered purchases', es: 'Compras introducidas', fr: 'Achats saisis', ja: '入力済みの購入', zh: '已录入的购买' },
  'עדכון': { en: 'Edit', es: 'Editar', fr: 'Modifier', ja: '編集', zh: '编辑' },
  'מחיקה': { en: 'Delete', es: 'Eliminar', fr: 'Supprimer', ja: '削除', zh: '删除' },
  'מחיר נוכחי {price} · בתיק {qty} יח׳': { en: 'Current price {price} · {qty} in portfolio', es: 'Precio actual {price} · {qty} en cartera', fr: 'Prix actuel {price} · {qty} en portefeuille', ja: '現在価格 {price} · 保有 {qty}点', zh: '当前价格 {price} · 持有 {qty} 件' },
  'עדכון רכישה': { en: 'Edit purchase', es: 'Editar compra', fr: 'Modifier l’achat', ja: '購入を編集', zh: '编辑购买记录' },
  'תאריך קנייה': { en: 'Purchase date', es: 'Fecha de compra', fr: 'Date d’achat', ja: '購入日', zh: '购买日期' },
  'כמות שנקנתה': { en: 'Quantity bought', es: 'Cantidad comprada', fr: 'Quantité achetée', ja: '購入数量', zh: '购买数量' },
  'סכום ששולם, סה״כ': { en: 'Total amount paid', es: 'Importe total pagado', fr: 'Montant total payé', ja: '支払総額', zh: '支付总额' },
  'מטבע': { en: 'Currency', es: 'Moneda', fr: 'Devise', ja: '通貨', zh: '货币' },
  '₪ שקל': { en: '₪ Shekel', es: '₪ Séquel', fr: '₪ Shekel', ja: '₪ シェケル', zh: '₪ 谢克尔' },
  '$ דולר': { en: '$ Dollar', es: '$ Dólar', fr: '$ Dollar', ja: '$ ドル', zh: '$ 美元' },
  'הערה (לא חובה)': { en: 'Note (optional)', es: 'Nota (opcional)', fr: 'Note (facultatif)', ja: 'メモ(任意)', zh: '备注(可选)' },
  'שמירת העדכון': { en: 'Save changes', es: 'Guardar cambios', fr: 'Enregistrer les modifications', ja: '変更を保存', zh: '保存修改' },
  'שמירה': { en: 'Save', es: 'Guardar', fr: 'Enregistrer', ja: '保存', zh: '保存' },
  'ביטול העדכון': { en: 'Cancel edit', es: 'Cancelar edición', fr: 'Annuler la modification', ja: '編集をキャンセル', zh: '取消编辑' },
  'סגירה': { en: 'Close', es: 'Cerrar', fr: 'Fermer', ja: '閉じる', zh: '关闭' },
  'ביטול': { en: 'Cancel', es: 'Cancelar', fr: 'Annuler', ja: 'キャンセル', zh: '取消' },
  'למחוק את הרכישה הזו?': { en: 'Delete this purchase?', es: '¿Eliminar esta compra?', fr: 'Supprimer cet achat ?', ja: 'この購入を削除しますか?', zh: '要删除这条购买记录吗?' },
  'המחיקה נכשלה: {msg}': { en: 'Delete failed: {msg}', es: 'Error al eliminar: {msg}', fr: 'Échec de la suppression : {msg}', ja: '削除に失敗しました: {msg}', zh: '删除失败:{msg}' },
  'אין שער זמין לתאריך הזה.': { en: 'No rate available for this date.', es: 'No hay tipo disponible para esta fecha.', fr: 'Aucun taux disponible pour cette date.', ja: 'この日付のレートはありません。', zh: '此日期没有可用汇率。' },
  'אין פרסום בתאריך הזה, נלקח השער האחרון שפורסם לפניו ({date}).': { en: 'Nothing was published on this date, so the last earlier rate was used ({date}).', es: 'No hubo publicación en esta fecha; se usa el último tipo anterior ({date}).', fr: 'Rien n’a été publié à cette date ; le dernier taux antérieur est utilisé ({date}).', ja: 'この日は公表がないため、直近のレートを使用しています({date})。', zh: '此日期未发布汇率,已使用之前最近的汇率({date})。' },
  'שער יציג ביום הקנייה': { en: 'Official rate on purchase day', es: 'Tipo oficial el día de compra', fr: 'Taux officiel le jour de l’achat', ja: '購入日の公表レート', zh: '购买日官方汇率' },
  'בשקלים לפי שער יום הקנייה': { en: 'In shekels at purchase-day rate', es: 'En séqueles al tipo del día de compra', fr: 'En shekels au taux du jour d’achat', ja: '購入日のレートでのシェケル額', zh: '按购买日汇率折合谢克尔' },
  'בדולרים לפי שער יום הקנייה': { en: 'In dollars at purchase-day rate', es: 'En dólares al tipo del día de compra', fr: 'En dollars au taux du jour d’achat', ja: '購入日のレートでのドル額', zh: '按购买日汇率折合美元' },
  'שווי היום (שער {rate})': { en: 'Value today (rate {rate})', es: 'Valor hoy (tipo {rate})', fr: 'Valeur actuelle (taux {rate})', ja: '現在の評価額(レート {rate})', zh: '当前价值(汇率 {rate})' },
  'סה״כ הרכישות ({total}) גדול מהכמות בתיק ({qty}).': { en: 'Total purchases ({total}) exceed the quantity in the portfolio ({qty}).', es: 'El total de compras ({total}) supera la cantidad en cartera ({qty}).', fr: 'Le total des achats ({total}) dépasse la quantité en portefeuille ({qty}).', ja: '購入数の合計({total})が保有数量({qty})を超えています。', zh: '购买总数({total})超过持有数量({qty})。' },
  'יש לבחור תאריך קנייה שאינו בעתיד.': { en: 'Choose a purchase date that isn’t in the future.', es: 'Elige una fecha de compra que no sea futura.', fr: 'Choisissez une date d’achat qui n’est pas dans le futur.', ja: '未来ではない購入日を選択してください。', zh: '请选择不晚于今天的购买日期。' },
  'יש להזין סכום גדול מאפס.': { en: 'Enter an amount greater than zero.', es: 'Introduce un importe mayor que cero.', fr: 'Saisissez un montant supérieur à zéro.', ja: '0より大きい金額を入力してください。', zh: '请输入大于零的金额。' },
  'הכמות צריכה להיות מספר שלם, 1 ומעלה.': { en: 'Quantity must be a whole number, 1 or more.', es: 'La cantidad debe ser un número entero, 1 o más.', fr: 'La quantité doit être un nombre entier, au moins 1.', ja: '数量は1以上の整数で入力してください。', zh: '数量必须是大于等于 1 的整数。' },
  'אין שער זמין לתאריך הזה. בדוק את החיבור לבנק ישראל ונסה שוב.': { en: 'No rate available for this date. Check the connection to the Bank of Israel and try again.', es: 'No hay tipo para esta fecha. Comprueba la conexión con el Banco de Israel e inténtalo de nuevo.', fr: 'Aucun taux pour cette date. Vérifiez la connexion à la Banque d’Israël et réessayez.', ja: 'この日付のレートはありません。イスラエル銀行への接続を確認して、もう一度お試しください。', zh: '此日期没有可用汇率。请检查与以色列银行的连接后重试。' },
  'הרכישה כבר לא קיימת': { en: 'This purchase no longer exists', es: 'Esta compra ya no existe', fr: 'Cet achat n’existe plus', ja: 'この購入はすでに存在しません', zh: '这条购买记录已不存在' },
  'העדכון נכשל: {msg}': { en: 'Update failed: {msg}', es: 'Error al actualizar: {msg}', fr: 'Échec de la mise à jour : {msg}', ja: '更新に失敗しました: {msg}', zh: '更新失败:{msg}' },
  'הרכישה עודכנה: {name}': { en: 'Purchase updated: {name}', es: 'Compra actualizada: {name}', fr: 'Achat mis à jour : {name}', ja: '購入を更新しました: {name}', zh: '购买记录已更新:{name}' },
  'השמירה נכשלה: {msg}': { en: 'Save failed: {msg}', es: 'Error al guardar: {msg}', fr: 'Échec de l’enregistrement : {msg}', ja: '保存に失敗しました: {msg}', zh: '保存失败:{msg}' },
  'נשמר: {name}': { en: 'Saved: {name}', es: 'Guardado: {name}', fr: 'Enregistré : {name}', ja: '保存しました: {name}', zh: '已保存:{name}' },

  // Sync
  'הנתונים עודכנו במקביל מחלון אחר, נסה שוב': { en: 'The data was changed from another window. Try again.', es: 'Los datos se han cambiado desde otra ventana. Inténtalo de nuevo.', fr: 'Les données ont été modifiées depuis une autre fenêtre. Réessayez.', ja: '別のウィンドウでデータが更新されました。もう一度お試しください。', zh: '数据已在其他窗口中更改,请重试。' },
  'תבנית שערים לא מוכרת': { en: 'Unrecognized rate format', es: 'Formato de tipos no reconocido', fr: 'Format de taux non reconnu', ja: 'レートの形式を認識できません', zh: '无法识别的汇率格式' },
  'הסנכרון לא הגיע מהתיק {name}': { en: 'The sync did not come from the {name} portfolio', es: 'La sincronización no procede de la cartera {name}', fr: 'La synchronisation ne provient pas du portefeuille {name}', ja: 'この同期は {name} ポートフォリオのものではありません', zh: '此同步并非来自投资组合 {name}' },
  'הסנכרון ריק': { en: 'The sync is empty', es: 'La sincronización está vacía', fr: 'La synchronisation est vide', ja: '同期データが空です', zh: '同步数据为空' },
  'הסנכרון האחרון לא תואם לגמרי את Collectr: {count} פריטים מול {expected}, {sum} מול {total}.': { en: 'The last sync doesn’t fully match Collectr: {count} items vs. {expected}, {sum} vs. {total}.', es: 'La última sincronización no coincide del todo con Collectr: {count} artículos frente a {expected}, {sum} frente a {total}.', fr: 'La dernière synchronisation ne correspond pas tout à fait à Collectr : {count} articles contre {expected}, {sum} contre {total}.', ja: '前回の同期は Collectr と完全には一致していません: {count}点 / {expected}点、{sum} / {total}。', zh: '上次同步与 Collectr 不完全一致:{count} 件对比 {expected} 件,{sum} 对比 {total}。' },
  'נתוני התיק לא נמצאו בדף': { en: 'Portfolio data was not found on the page', es: 'No se encontraron los datos de la cartera en la página', fr: 'Données du portefeuille introuvables sur la page', ja: 'ページにポートフォリオのデータが見つかりません', zh: '页面上未找到投资组合数据' },
  'נתוני התיק חתוכים': { en: 'Portfolio data is incomplete', es: 'Los datos de la cartera están incompletos', fr: 'Les données du portefeuille sont incomplètes', ja: 'ポートフォリオのデータが不完全です', zh: '投资组合数据不完整' },
  'התיק {name} כבר לא מופיע בפרופיל': { en: 'The {name} portfolio is no longer on the profile', es: 'La cartera {name} ya no aparece en el perfil', fr: 'Le portefeuille {name} n’apparaît plus dans le profil', ja: '{name} ポートフォリオはプロフィールに表示されなくなりました', zh: '投资组合 {name} 已不在个人资料中' },
  'נטענו {n} מוצרים לתיק {name}': { en: P('Loaded {n} product into {name}', 'Loaded {n} products into {name}'), es: P('{n} producto cargado en {name}', '{n} productos cargados en {name}'), fr: P('{n} produit chargé dans {name}', '{n} produits chargés dans {name}'), ja: '{name} に{n}点の商品を読み込みました', zh: '已将 {n} 个产品加载到 {name}' },
  'סנכרון הושלם: {n} מוצרים': { en: P('Sync complete: {n} product', 'Sync complete: {n} products'), es: P('Sincronización completada: {n} producto', 'Sincronización completada: {n} productos'), fr: P('Synchronisation terminée : {n} produit', 'Synchronisation terminée : {n} produits'), ja: '同期が完了しました: {n}点', zh: '同步完成:{n} 个产品' },
  ', {n} חדשים': { en: ', {n} new', es: P(', {n} nuevo', ', {n} nuevos'), fr: P(', {n} nouveau', ', {n} nouveaux'), ja: '、新着{n}点', zh: ',新增 {n} 个' },
  'סנכרון נכשל: {msg}': { en: 'Sync failed: {msg}', es: 'Error de sincronización: {msg}', fr: 'Échec de la synchronisation : {msg}', ja: '同期に失敗しました: {msg}', zh: '同步失败:{msg}' },
  'שמירת הסנכרון נכשלה: {msg}': { en: 'Saving the sync failed: {msg}', es: 'Error al guardar la sincronización: {msg}', fr: 'Échec de l’enregistrement de la synchronisation : {msg}', ja: '同期の保存に失敗しました: {msg}', zh: '保存同步失败:{msg}' },
  'סנכרון מלא מ-Collectr': { en: 'Full sync from Collectr', es: 'Sincronización completa desde Collectr', fr: 'Synchronisation complète depuis Collectr', ja: 'Collectr から完全同期', zh: '从 Collectr 完整同步' },
  'השרת של Collectr חוסם בקשות שלא מגיעות מדפדפן, ולכן הסנכרון רץ מהדפדפן שלך, בדף של Collectr עצמו. הסימניה קוראת את כל התיקים בפרופיל, והאפליקציה שומרת רק את התיקים שהוספת.': { en: 'Collectr’s server blocks requests that don’t come from a browser, so the sync runs in your own browser, on the Collectr page. The bookmark reads every portfolio on the profile, and the app keeps only the ones you added.', es: 'El servidor de Collectr bloquea las solicitudes que no vienen de un navegador, así que la sincronización se ejecuta en tu navegador, en la propia página de Collectr. El marcador lee todas las carteras del perfil y la aplicación solo guarda las que añadiste.', fr: 'Le serveur de Collectr bloque les requêtes qui ne viennent pas d’un navigateur : la synchronisation s’exécute donc dans votre navigateur, sur la page de Collectr. Le favori lit tous les portefeuilles du profil et l’application ne conserve que ceux que vous avez ajoutés.', ja: 'Collectr のサーバーはブラウザ以外からのリクエストをブロックするため、同期はお使いのブラウザの Collectr ページ上で実行されます。ブックマークはプロフィールのすべてのポートフォリオを読み取り、アプリは追加済みのものだけを保存します。', zh: 'Collectr 的服务器会拦截非浏览器发出的请求,因此同步在你的浏览器中、Collectr 页面上运行。书签会读取个人资料中的所有投资组合,应用只保存你添加的那些。' },
  '<b>פעם אחת בלבד:</b> גרור את הכפתור הזה לסרגל הסימניות (Ctrl+Shift+B מציג אותו). אם יש לך כבר סימניית סנכרון ישנה, החלף אותה בזו: הישנה מסנכרנת רק את Main.': { en: '<b>One time only:</b> drag this button to your bookmarks bar (Ctrl+Shift+B shows it). If you already have an old sync bookmark, replace it with this one: the old one syncs only Main.', es: '<b>Solo una vez:</b> arrastra este botón a la barra de marcadores (Ctrl+Shift+B la muestra). Si ya tienes un marcador de sincronización antiguo, sustitúyelo por este: el antiguo solo sincroniza Main.', fr: '<b>Une seule fois :</b> faites glisser ce bouton vers la barre de favoris (Ctrl+Shift+B l’affiche). Si vous avez déjà un ancien favori de synchronisation, remplacez-le par celui-ci : l’ancien ne synchronise que Main.', ja: '<b>初回のみ:</b> このボタンをブックマークバーにドラッグします(Ctrl+Shift+B で表示)。古い同期ブックマークがある場合は、これに置き換えてください。古いものは Main のみを同期します。', zh: '<b>仅需一次:</b>将此按钮拖到书签栏(按 Ctrl+Shift+B 显示)。如果已有旧的同步书签,请用这个替换:旧书签只同步 Main。' },
  'סנכרון Collectr': { en: 'Collectr sync', es: 'Sincronizar Collectr', fr: 'Synchro Collectr', ja: 'Collectr 同期', zh: 'Collectr 同步' },
  'פתח את הפרופיל של התיק <b>{name}</b> ב-Collectr והמתן לטעינה.': { en: 'Open the profile of the <b>{name}</b> portfolio on Collectr and wait for it to load.', es: 'Abre el perfil de la cartera <b>{name}</b> en Collectr y espera a que cargue.', fr: 'Ouvrez le profil du portefeuille <b>{name}</b> sur Collectr et attendez le chargement.', ja: 'Collectr で <b>{name}</b> ポートフォリオのプロフィールを開き、読み込みが終わるまで待ちます。', zh: '在 Collectr 上打开投资组合 <b>{name}</b> 的个人资料页,等待加载完成。' },
  'פתיחת הדף': { en: 'Open page', es: 'Abrir página', fr: 'Ouvrir la page', ja: 'ページを開く', zh: '打开页面' },
  'לחץ על הסימניה. האפליקציה תיפתח בחלון משלה ותתעדכן מעצמה. אם הדפדפן חוסם חלון קופץ, יש לאשר אותו.': { en: 'Click the bookmark. The app opens in its own window and updates by itself. If the browser blocks the pop-up, allow it.', es: 'Haz clic en el marcador. La aplicación se abrirá en su propia ventana y se actualizará sola. Si el navegador bloquea la ventana emergente, permítela.', fr: 'Cliquez sur le favori. L’application s’ouvre dans sa propre fenêtre et se met à jour toute seule. Si le navigateur bloque la fenêtre contextuelle, autorisez-la.', ja: 'ブックマークをクリックします。アプリが別ウィンドウで開き、自動で更新されます。ポップアップがブロックされた場合は許可してください。', zh: '点击书签。应用会在单独的窗口中打开并自动更新。如果浏览器拦截了弹出窗口,请允许。' },
  'יש לגרור את הכפתור לסרגל הסימניות': { en: 'Drag the button to your bookmarks bar', es: 'Arrastra el botón a la barra de marcadores', fr: 'Faites glisser le bouton vers la barre de favoris', ja: 'ボタンをブックマークバーにドラッグしてください', zh: '请将按钮拖到书签栏' },
  'הנתונים עודכנו': { en: 'Data updated', es: 'Datos actualizados', fr: 'Données mises à jour', ja: 'データを更新しました', zh: '数据已更新' },
  'נמצאו {n} מוצרים חדשים': { en: P('Found {n} new product', 'Found {n} new products'), es: P('{n} producto nuevo encontrado', '{n} productos nuevos encontrados'), fr: P('{n} nouveau produit trouvé', '{n} nouveaux produits trouvés'), ja: '新しい商品が{n}点見つかりました', zh: '发现 {n} 个新产品' },
  'שגיאה בטעינה: {msg}': { en: 'Loading error: {msg}', es: 'Error de carga: {msg}', fr: 'Erreur de chargement : {msg}', ja: '読み込みエラー: {msg}', zh: '加载错误:{msg}' },
  'המעבר נכשל: {msg}': { en: 'Switching failed: {msg}', es: 'Error al cambiar: {msg}', fr: 'Échec du changement : {msg}', ja: '切り替えに失敗しました: {msg}', zh: '切换失败:{msg}' },

  // Bookmark messages (shown on the Collectr and eBay pages)
  'יש ללחוץ על הסימניה בדף של פרופיל ב-Collectr (showcase/profile).': { en: 'Click the bookmark on a Collectr profile page (showcase/profile).', es: 'Haz clic en el marcador en una página de perfil de Collectr (showcase/profile).', fr: 'Cliquez sur le favori depuis une page de profil Collectr (showcase/profile).', ja: 'Collectr のプロフィールページ(showcase/profile)でブックマークをクリックしてください。', zh: '请在 Collectr 个人资料页面(showcase/profile)上点击书签。' },
  'יש ללחוץ על הסימניה בדף חיפוש של eBay שנפתח מהאפליקציה.': { en: 'Click the bookmark on an eBay search page opened from the app.', es: 'Haz clic en el marcador en una búsqueda de eBay abierta desde la aplicación.', fr: 'Cliquez sur le favori depuis une recherche eBay ouverte par l’application.', ja: 'アプリから開いた eBay の検索ページでブックマークをクリックしてください。', zh: '请在从应用打开的 eBay 搜索页面上点击书签。' },
  'הדפדפן חסם את פתיחת האפליקציה. יש לאשר חלונות קופצים מהאתר הזה ולנסות שוב.': { en: 'The browser blocked the app from opening. Allow pop-ups from this site and try again.', es: 'El navegador ha bloqueado la aplicación. Permite las ventanas emergentes de este sitio e inténtalo de nuevo.', fr: 'Le navigateur a bloqué l’ouverture de l’application. Autorisez les fenêtres contextuelles de ce site et réessayez.', ja: 'ブラウザがアプリの起動をブロックしました。このサイトのポップアップを許可して、もう一度お試しください。', zh: '浏览器阻止了应用打开。请允许此网站的弹出窗口后重试。' },
  'נקראו {n} תוצאות, שולח לאפליקציה…': { en: 'Results read: {n}. Sending to the app…', es: 'Resultados leídos: {n}. Enviando a la aplicación…', fr: 'Résultats lus : {n}. Envoi à l’application…', ja: '{n}件を読み取りました。アプリに送信中…', zh: '已读取 {n} 条结果,正在发送到应用…' },
  '✓ נשלח לאפליקציה': { en: '✓ Sent to the app', es: '✓ Enviado a la aplicación', fr: '✓ Envoyé à l’application', ja: '✓ アプリに送信しました', zh: '✓ 已发送到应用' },
  'האפליקציה לא ענתה. האם היא פועלת?': { en: 'The app didn’t respond. Is it running?', es: 'La aplicación no ha respondido. ¿Está en marcha?', fr: 'L’application n’a pas répondu. Est-elle lancée ?', ja: 'アプリから応答がありません。起動していますか?', zh: '应用没有响应。它正在运行吗?' },
  'מסנכרן…': { en: 'Syncing…', es: 'Sincronizando…', fr: 'Synchronisation…', ja: '同期中…', zh: '正在同步…' },
  'Collectr החזיר {s}. רענן את הדף ונסה שוב.': { en: 'Collectr returned {s}. Refresh the page and try again.', es: 'Collectr devolvió {s}. Actualiza la página e inténtalo de nuevo.', fr: 'Collectr a renvoyé {s}. Actualisez la page et réessayez.', ja: 'Collectr が {s} を返しました。ページを更新して、もう一度お試しください。', zh: 'Collectr 返回 {s}。请刷新页面后重试。' },
  'לא נמצאו תיקים בפרופיל': { en: 'No portfolios found on the profile', es: 'No se encontraron carteras en el perfil', fr: 'Aucun portefeuille trouvé dans le profil', ja: 'プロフィールにポートフォリオが見つかりません', zh: '个人资料中未找到投资组合' },
  'מסנכרן את {name}… {n}': { en: 'Syncing {name}… {n}', es: 'Sincronizando {name}… {n}', fr: 'Synchronisation de {name}… {n}', ja: '{name} を同期中… {n}', zh: '正在同步 {name}… {n}' },
  '✓ נשלחו {n} תיקים לאפליקציה.': { en: '✓ Portfolios sent to the app: {n}.', es: '✓ Carteras enviadas a la aplicación: {n}.', fr: '✓ Portefeuilles envoyés à l’application : {n}.', ja: '✓ {n}件のポートフォリオをアプリに送信しました。', zh: '✓ 已将 {n} 个投资组合发送到应用。' },
  'הסנכרון נכשל: {m}': { en: 'Sync failed: {m}', es: 'Error de sincronización: {m}', fr: 'Échec de la synchronisation : {m}', ja: '同期に失敗しました: {m}', zh: '同步失败:{m}' },

  // Listing checks
  'המחיר אינו סכום אחד בדולרים': { en: 'The price isn’t a single dollar amount', es: 'El precio no es un único importe en dólares', fr: 'Le prix n’est pas un montant unique en dollars', ja: '価格が単一のドル金額ではありません', zh: '价格不是单一美元金额' },
  'אין תאריך מכירה': { en: 'No sale date', es: 'Sin fecha de venta', fr: 'Pas de date de vente', ja: '販売日がありません', zh: '没有成交日期' },
  'לא מכירה פומבית': { en: 'Not an auction', es: 'No es una subasta', fr: 'Pas une enchère', ja: 'オークションではありません', zh: '不是拍卖' },
  'הדירוג בכותרת אינו {grade}': { en: 'The grade in the title isn’t {grade}', es: 'El grado del título no es {grade}', fr: 'Le grade du titre n’est pas {grade}', ja: 'タイトルのグレードが {grade} ではありません', zh: '标题中的评级不是 {grade}' },
  'חבילה או פריט לא מקורי': { en: 'Lot or non-original item', es: 'Lote o artículo no original', fr: 'Lot ou article non original', ja: 'まとめ売りまたは非正規品', zh: '批量出售或非正品' },
  'דירוג מיוחד': { en: 'Special grade', es: 'Grado especial', fr: 'Grade spécial', ja: '特別グレード', zh: '特殊评级' },
  'גרסת Reverse Holo': { en: 'Reverse Holo version', es: 'Versión Reverse Holo', fr: 'Version Reverse Holo', ja: 'リバースホロ版', zh: 'Reverse Holo 版本' },
  'לא גרסת Reverse Holo': { en: 'Not the Reverse Holo version', es: 'No es la versión Reverse Holo', fr: 'Pas la version Reverse Holo', ja: 'リバースホロ版ではありません', zh: '不是 Reverse Holo 版本' },
  'גרסה שאינה Holo': { en: 'Non-Holo version', es: 'Versión no Holo', fr: 'Version non Holo', ja: 'ノンホロ版', zh: '非 Holo 版本' },
  'גרסת Holo': { en: 'Holo version', es: 'Versión Holo', fr: 'Version Holo', ja: 'ホロ版', zh: 'Holo 版本' },
  'גרסה מיוחדת של הקלף': { en: 'Special version of the card', es: 'Versión especial de la carta', fr: 'Version spéciale de la carte', ja: 'カードの特別版', zh: '卡牌的特殊版本' },
  'שפה אחרת': { en: 'Different language', es: 'Otro idioma', fr: 'Autre langue', ja: '別の言語', zh: '其他语言' },
  'שם הקלף שונה': { en: 'Different card name', es: 'Nombre de carta distinto', fr: 'Nom de carte différent', ja: 'カード名が異なります', zh: '卡牌名称不同' },
  'מספר הקלף שונה': { en: 'Different card number', es: 'Número de carta distinto', fr: 'Numéro de carte différent', ja: 'カード番号が異なります', zh: '卡牌编号不同' },
  'חסר שם הסט Celebrations': { en: 'Missing the set name Celebrations', es: 'Falta el nombre del set Celebrations', fr: 'Nom de série Celebrations manquant', ja: 'セット名 Celebrations がありません', zh: '缺少系列名称 Celebrations' },
  'הקלף לא נמצא': { en: 'Card not found', es: 'Carta no encontrada', fr: 'Carte introuvable', ja: 'カードが見つかりません', zh: '未找到卡牌' },
  'המחיר אינו בדולרים': { en: 'The price isn’t in dollars', es: 'El precio no está en dólares', fr: 'Le prix n’est pas en dollars', ja: '価格がドルではありません', zh: '价格不是美元' },
  'מכירה ישנה': { en: 'Old sale', es: 'Venta antigua', fr: 'Vente ancienne', ja: '古い販売', zh: '旧成交' },
  'הדירוג אינו {grade}': { en: 'The grade isn’t {grade}', es: 'El grado no es {grade}', fr: 'Le grade n’est pas {grade}', ja: 'グレードが {grade} ではありません', zh: '评级不是 {grade}' },

  // Graded prices
  'לא הוגדר מפתח CompSniper.': { en: 'No CompSniper key is set.', es: 'No hay ninguna clave de CompSniper configurada.', fr: 'Aucune clé CompSniper n’est configurée.', ja: 'CompSniper のキーが設定されていません。', zh: '尚未设置 CompSniper 密钥。' },
  'CompSniper לא קיבל את המפתח. בדוק אותו במסך מחירי המדורגים.': { en: 'CompSniper rejected the key. Check it on the Graded prices screen.', es: 'CompSniper no aceptó la clave. Compruébala en la pantalla de precios de graduadas.', fr: 'CompSniper a refusé la clé. Vérifiez-la dans l’écran des prix des cartes gradées.', ja: 'CompSniper がキーを受け付けませんでした。鑑定カード価格の画面で確認してください。', zh: 'CompSniper 未接受该密钥。请在评级卡价格页面中检查。' },
  'המכסה החודשית של CompSniper נגמרה. שאר הקלפים יתעדכנו אחרי האיפוס, בלי עלות.': { en: 'The monthly CompSniper quota is used up. The remaining cards will update after the reset, at no cost.', es: 'Se ha agotado la cuota mensual de CompSniper. Las demás cartas se actualizarán tras el reinicio, sin coste.', fr: 'Le quota mensuel de CompSniper est épuisé. Les autres cartes seront mises à jour après la réinitialisation, sans frais.', ja: 'CompSniper の月間上限に達しました。残りのカードはリセット後に無料で更新されます。', zh: 'CompSniper 本月配额已用完。其余卡牌将在重置后更新,不会产生费用。' },
  'הגעת לתקרת הבקשות החודשית שהוגדרה באפליקציה. העדכון יימשך בחודש הבא.': { en: 'You’ve reached the app’s monthly request limit. Updates will continue next month.', es: 'Has alcanzado el límite mensual de solicitudes de la aplicación. La actualización continuará el mes que viene.', fr: 'Vous avez atteint la limite mensuelle de requêtes de l’application. La mise à jour reprendra le mois prochain.', ja: 'アプリの月間リクエスト上限に達しました。更新は来月再開されます。', zh: '已达到应用设置的每月请求上限。更新将在下月继续。' },
  'עדכון המדורגים נעצר: {msg}': { en: 'Graded update stopped: {msg}', es: 'Actualización de graduadas detenida: {msg}', fr: 'Mise à jour des gradées interrompue : {msg}', ja: '鑑定カードの更新を停止しました: {msg}', zh: '评级卡更新已停止:{msg}' },
  '{n} מכירות': { en: '{n} sales', es: '{n} ventas', fr: '{n} ventes', ja: '{n}件の販売', zh: '{n} 笔成交' },
  'רק {n} מכירות, לפי Collectr': { en: P('Only {n} sale, using Collectr', 'Only {n} sales, using Collectr'), es: P('Solo {n} venta, según Collectr', 'Solo {n} ventas, según Collectr'), fr: P('Seulement {n} vente, selon Collectr', 'Seulement {n} ventes, selon Collectr'), ja: '販売{n}件のみ、Collectr 価格を使用', zh: '仅 {n} 笔成交,按 Collectr 计价' },
  'אין מכירות, לפי Collectr': { en: 'No sales, using Collectr', es: 'Sin ventas, según Collectr', fr: 'Aucune vente, selon Collectr', ja: '販売なし、Collectr 価格を使用', zh: '无成交,按 Collectr 计价' },
  'מעדכן {i} מתוך {total}: {name}': { en: 'Updating {i} of {total}: {name}', es: 'Actualizando {i} de {total}: {name}', fr: 'Mise à jour {i} sur {total} : {name}', ja: '更新中 {i}/{total}: {name}', zh: '正在更新 {i}/{total}:{name}' },
  'עודכנו {n} קלפים מדורגים לפי מכירות אחרונות': { en: P('Updated {n} graded card from recent sales', 'Updated {n} graded cards from recent sales'), es: P('{n} carta graduada actualizada según ventas recientes', '{n} cartas graduadas actualizadas según ventas recientes'), fr: P('{n} carte gradée mise à jour selon les ventes récentes', '{n} cartes gradées mises à jour selon les ventes récentes'), ja: '最近の販売に基づき鑑定カード{n}枚を更新しました', zh: '已根据近期成交更新 {n} 张评级卡' },
  'פער גדול': { en: 'Large gap', es: 'Gran diferencia', fr: 'Écart important', ja: '大きな差', zh: '差距较大' },
  'טרם עודכן': { en: 'Not updated yet', es: 'Aún sin actualizar', fr: 'Pas encore mis à jour', ja: '未更新', zh: '尚未更新' },
  'מפתח API של CompSniper': { en: 'CompSniper API key', es: 'Clave API de CompSniper', fr: 'Clé API CompSniper', ja: 'CompSniper API キー', zh: 'CompSniper API 密钥' },
  'להחלפת המפתח השמור': { en: 'Replace the saved key', es: 'Sustituir la clave guardada', fr: 'Remplacer la clé enregistrée', ja: '保存済みのキーを置き換える', zh: '替换已保存的密钥' },
  'שמירת מפתח': { en: 'Save key', es: 'Guardar clave', fr: 'Enregistrer la clé', ja: 'キーを保存', zh: '保存密钥' },
  'מחירי קלפים מדורגים': { en: 'Graded card prices', es: 'Precios de cartas graduadas', fr: 'Prix des cartes gradées', ja: '鑑定カードの価格', zh: '评级卡价格' },
  'הערך הוא ממוצע 5 המכירות הפומביות האחרונות ב-eBay, עם השלמה מ-Fanatics כשאין מספיק. אם גם אז יש פחות מ-5, הקלף נשאר לפי Collectr. העדכון רץ פעם בשבוע כשהאפליקציה פתוחה.': { en: 'The value is the average of the last 5 eBay auctions, filled in from Fanatics when there aren’t enough. With fewer than 5 even then, the card stays on its Collectr price. The update runs once a week while the app is open.', es: 'El valor es la media de las últimas 5 subastas de eBay, completada con Fanatics si no hay suficientes. Si aun así hay menos de 5, la carta mantiene el precio de Collectr. La actualización se ejecuta una vez por semana con la aplicación abierta.', fr: 'La valeur est la moyenne des 5 dernières enchères eBay, complétée par Fanatics s’il n’y en a pas assez. S’il y en a encore moins de 5, la carte reste au prix de Collectr. La mise à jour s’exécute une fois par semaine quand l’application est ouverte.', ja: '評価額は eBay の直近5件のオークションの平均で、足りない場合は Fanatics で補います。それでも5件未満の場合は Collectr の価格のままです。更新はアプリを開いている間に週1回実行されます。', zh: '估值为 eBay 最近 5 笔拍卖的平均价,不足时由 Fanatics 补充。如果仍不足 5 笔,该卡沿用 Collectr 价格。应用打开时每周更新一次。' },
  'עדכון מחירי מדורגים בתיק <b>{name}</b>': { en: 'Update graded prices in <b>{name}</b>', es: 'Actualizar precios de graduadas en <b>{name}</b>', fr: 'Mettre à jour les prix des gradées dans <b>{name}</b>', ja: '<b>{name}</b> の鑑定カード価格を更新', zh: '更新 <b>{name}</b> 中的评级卡价格' },
  'המכסה החודשית משותפת לכל התיקים: כל קלף מדורג צורך בקשה אחת בשבוע': { en: 'The monthly quota is shared by all portfolios: each graded card uses one request a week', es: 'La cuota mensual es común a todas las carteras: cada carta graduada consume una solicitud por semana', fr: 'Le quota mensuel est partagé entre tous les portefeuilles : chaque carte gradée utilise une requête par semaine', ja: '月間上限はすべてのポートフォリオで共有され、鑑定カード1枚につき週1回リクエストを使います', zh: '每月配额由所有投资组合共享:每张评级卡每周使用一次请求' },
  ', ובתיק הזה יש {n}': { en: ', and this portfolio has {n}', es: ', y esta cartera tiene {n}', fr: ', et ce portefeuille en compte {n}', ja: '(このポートフォリオには{n}枚)', zh: ',此投资组合有 {n} 张' },
  '. כשהעדכון כבוי, הקלפים בתיק מתומחרים לפי Collectr.': { en: '. When updates are off, the portfolio’s cards use Collectr prices.', es: '. Con la actualización desactivada, las cartas usan los precios de Collectr.', fr: '. Quand la mise à jour est désactivée, les cartes utilisent les prix de Collectr.', ja: '。更新がオフの場合、カードは Collectr の価格で評価されます。', zh: '。更新关闭时,卡牌按 Collectr 价格计价。' },
  'בקשות שהאפליקציה שלחה החודש': { en: 'Requests the app sent this month', es: 'Solicitudes enviadas este mes', fr: 'Requêtes envoyées ce mois-ci', ja: '今月アプリが送信したリクエスト', zh: '应用本月发送的请求' },
  'נשארו לפי CompSniper': { en: 'Remaining according to CompSniper', es: 'Restantes según CompSniper', fr: 'Restantes selon CompSniper', ja: 'CompSniper の残り回数', zh: 'CompSniper 显示的剩余次数' },
  'עדכון אחרון': { en: 'Last update', es: 'Última actualización', fr: 'Dernière mise à jour', ja: '前回の更新', zh: '上次更新' },
  'נרשמים ל-{link} במסלול <b>Basic</b> בחינם. <b>לא מזינים אמצעי תשלום.</b>': { en: 'Sign up to {link} on the free <b>Basic</b> plan. <b>Do not enter any payment details.</b>', es: 'Regístrate en {link} con el plan gratuito <b>Basic</b>. <b>No introduzcas ningún medio de pago.</b>', fr: 'Inscrivez-vous sur {link} avec l’offre gratuite <b>Basic</b>. <b>Ne saisissez aucun moyen de paiement.</b>', ja: '{link} に無料の <b>Basic</b> プランで登録します。<b>支払い情報は入力しないでください。</b>', zh: '在 {link} 注册免费的 <b>Basic</b> 套餐。<b>不要输入任何付款信息。</b>' },
  'מעתיקים את מפתח ה-API מהחשבון ומדביקים כאן. הוא נשמר רק במחשב הזה.': { en: 'Copy the API key from your account and paste it here. It is saved only on this computer.', es: 'Copia la clave API de tu cuenta y pégala aquí. Solo se guarda en este ordenador.', fr: 'Copiez la clé API depuis votre compte et collez-la ici. Elle n’est enregistrée que sur cet ordinateur.', ja: 'アカウントから API キーをコピーしてここに貼り付けます。キーはこのコンピューターにのみ保存されます。', zh: '从账户中复制 API 密钥并粘贴到此处。密钥只保存在这台电脑上。' },
  'קלף': { en: 'Card', es: 'Carta', fr: 'Carte', ja: 'カード', zh: '卡牌' },
  'ממוצע מכירות': { en: 'Sales average', es: 'Media de ventas', fr: 'Moyenne des ventes', ja: '販売平均', zh: '成交均价' },
  'סטטוס': { en: 'Status', es: 'Estado', fr: 'État', ja: '状態', zh: '状态' },
  'עדכון עכשיו ({n} קלפים)': { en: P('Update now ({n} card)', 'Update now ({n} cards)'), es: P('Actualizar ahora ({n} carta)', 'Actualizar ahora ({n} cartas)'), fr: P('Mettre à jour ({n} carte)', 'Mettre à jour ({n} cartes)'), ja: '今すぐ更新({n}枚)', zh: '立即更新({n} 张)' },
  'הכול עודכן היום': { en: 'All updated today', es: 'Todo actualizado hoy', fr: 'Tout est à jour aujourd’hui', ja: '本日すべて更新済み', zh: '今天已全部更新' },
  'הסרת המפתח': { en: 'Remove key', es: 'Eliminar clave', fr: 'Supprimer la clé', ja: 'キーを削除', zh: '移除密钥' },
  'המפתח לא נראה תקין. העתק אותו שוב מהחשבון ב-CompSniper.': { en: 'The key doesn’t look valid. Copy it again from your CompSniper account.', es: 'La clave no parece válida. Cópiala de nuevo desde tu cuenta de CompSniper.', fr: 'La clé ne semble pas valide. Copiez-la à nouveau depuis votre compte CompSniper.', ja: 'キーが正しくないようです。CompSniper のアカウントからもう一度コピーしてください。', zh: '密钥似乎无效。请从 CompSniper 账户重新复制。' },
  'המפתח נשמר': { en: 'Key saved', es: 'Clave guardada', fr: 'Clé enregistrée', ja: 'キーを保存しました', zh: '密钥已保存' },
  'עדכון מחירים רץ כרגע, נסה שוב בסיומו': { en: 'A price update is running. Try again when it finishes.', es: 'Hay una actualización de precios en curso. Inténtalo de nuevo cuando termine.', fr: 'Une mise à jour des prix est en cours. Réessayez une fois terminée.', ja: '価格を更新中です。完了後にもう一度お試しください。', zh: '价格更新正在运行,请在完成后重试。' },
  'נפתח חיפוש ל-{name}. בסיום הטעינה לוחצים שם על הסימניה.': { en: 'Opened a search for {name}. When it finishes loading, click the bookmark there.', es: 'Búsqueda abierta para {name}. Cuando termine de cargar, haz clic allí en el marcador.', fr: 'Recherche ouverte pour {name}. Une fois chargée, cliquez sur le favori depuis cette page.', ja: '{name} の検索を開きました。読み込みが終わったら、そこでブックマークをクリックしてください。', zh: '已打开 {name} 的搜索。加载完成后,请在该页面点击书签。' },
  'קריאת מכירות eBay': { en: 'Read eBay sales', es: 'Leer ventas de eBay', fr: 'Lire les ventes eBay', ja: 'eBay 販売を読み取る', zh: '读取 eBay 成交' },
  'מחירי קלפים מדורגים מ-eBay': { en: 'Graded card prices from eBay', es: 'Precios de cartas graduadas de eBay', fr: 'Prix des cartes gradées sur eBay', ja: 'eBay の鑑定カード価格', zh: '来自 eBay 的评级卡价格' },
  'השווי נקבע לפי הממוצע של 5 המכירות הפומביות האחרונות. בדרך הזו הקריאה נעשית מהדף שאתה פותח ב-Chrome.': { en: 'The value is the average of the last 5 auctions. This way, the data is read from the page you open in Chrome.', es: 'El valor es la media de las últimas 5 subastas. De esta forma, los datos se leen de la página que abres en Chrome.', fr: 'La valeur est la moyenne des 5 dernières enchères. De cette façon, les données sont lues depuis la page que vous ouvrez dans Chrome.', ja: '評価額は直近5件のオークションの平均です。この方法では、Chrome で開いたページからデータを読み取ります。', zh: '估值为最近 5 笔拍卖的平均价。此方式从你在 Chrome 中打开的页面读取数据。' },
  '<b>פעם אחת בלבד:</b> גרור את הכפתור הזה לסרגל הסימניות.': { en: '<b>One time only:</b> drag this button to your bookmarks bar.', es: '<b>Solo una vez:</b> arrastra este botón a la barra de marcadores.', fr: '<b>Une seule fois :</b> faites glisser ce bouton vers la barre de favoris.', ja: '<b>初回のみ:</b> このボタンをブックマークバーにドラッグします。', zh: '<b>仅需一次:</b>将此按钮拖到书签栏。' },
  'פתח את החיפוש של הקלף והמתן לטעינה.': { en: 'Open the card’s search and wait for it to load.', es: 'Abre la búsqueda de la carta y espera a que cargue.', fr: 'Ouvrez la recherche de la carte et attendez le chargement.', ja: 'カードの検索を開き、読み込みが終わるまで待ちます。', zh: '打开该卡的搜索页面,等待加载完成。' },
  'פתיחת החיפוש של {name}': { en: 'Open search for {name}', es: 'Abrir búsqueda de {name}', fr: 'Ouvrir la recherche de {name}', ja: '{name} の検索を開く', zh: '打开 {name} 的搜索' },
  'לחץ על הסימניה. האפליקציה תראה אילו מכירות נכללו, ושום דבר לא נשמר לפני אישור שלך.': { en: 'Click the bookmark. The app will show which sales were included, and nothing is saved until you approve.', es: 'Haz clic en el marcador. La aplicación mostrará qué ventas se incluyeron y no se guardará nada sin tu aprobación.', fr: 'Cliquez sur le favori. L’application indiquera les ventes retenues, et rien n’est enregistré sans votre accord.', ja: 'ブックマークをクリックします。対象の販売がアプリに表示され、承認するまで何も保存されません。', zh: '点击书签。应用会显示纳入的成交记录,未经你确认不会保存任何内容。' },
  'בחר קלף': { en: 'Choose a card', es: 'Elige una carta', fr: 'Choisissez une carte', ja: 'カードを選択', zh: '选择卡牌' },
  'הדף הזה אינו חיפוש של מכירות פומביות שהסתיימו, ולכן לא נקרא ממנו מחיר. יש לפתוח את החיפוש מכפתור eBay באפליקציה.': { en: 'This page isn’t a search of completed auctions, so no price was read from it. Open the search from the eBay button in the app.', es: 'Esta página no es una búsqueda de subastas finalizadas, así que no se ha leído ningún precio. Abre la búsqueda con el botón eBay de la aplicación.', fr: 'Cette page n’est pas une recherche d’enchères terminées : aucun prix n’a été lu. Ouvrez la recherche avec le bouton eBay de l’application.', ja: 'このページは終了したオークションの検索ではないため、価格は読み取られませんでした。アプリの eBay ボタンから検索を開いてください。', zh: '此页面不是已结束拍卖的搜索结果,因此未读取价格。请通过应用中的 eBay 按钮打开搜索。' },
  'לא זיהיתי לאיזה קלף שייך החיפוש. בחר קלף מהרשימה.': { en: 'I couldn’t tell which card this search belongs to. Choose a card from the list.', es: 'No se pudo identificar a qué carta corresponde la búsqueda. Elige una carta de la lista.', fr: 'Impossible d’identifier la carte de cette recherche. Choisissez une carte dans la liste.', ja: 'この検索がどのカードのものか判別できません。リストからカードを選択してください。', zh: '无法识别此搜索对应的卡牌。请从列表中选择。' },
  'לא נקראו תוצאות מהדף. ייתכן ש-eBay שינה את מבנה הדף, או שאין תוצאות לחיפוש הזה.': { en: 'No results were read from the page. eBay may have changed its layout, or this search has no results.', es: 'No se leyó ningún resultado de la página. Puede que eBay haya cambiado su estructura o que la búsqueda no tenga resultados.', fr: 'Aucun résultat n’a été lu sur la page. eBay a peut-être modifié sa structure, ou cette recherche n’a aucun résultat.', ja: 'ページから結果を読み取れませんでした。eBay のページ構成が変わったか、検索結果がない可能性があります。', zh: '未从页面读取到结果。可能是 eBay 更改了页面结构,或此搜索没有结果。' },
  'לא נמצאה מכירה שתואמת בדיוק לקלף ולדירוג, והמחיר הנוכחי נשאר ({price}).': { en: 'No sale exactly matches this card and grade, so the current price stays ({price}).', es: 'Ninguna venta coincide exactamente con la carta y el grado, así que se mantiene el precio actual ({price}).', fr: 'Aucune vente ne correspond exactement à cette carte et ce grade : le prix actuel est conservé ({price}).', ja: 'カードとグレードに完全に一致する販売がないため、現在の価格のままです({price})。', zh: '没有与该卡和评级完全匹配的成交,因此保持当前价格({price})。' },
  'נמצאו רק {n} מכירות מתאימות, פחות מ-5, ולכן הקלף נשאר לפי המחיר הנוכחי ({price}).': { en: P('Only {n} matching sale found, fewer than 5, so the card stays at its current price ({price}).', 'Only {n} matching sales found, fewer than 5, so the card stays at its current price ({price}).'), es: P('Solo se encontró {n} venta válida, menos de 5, así que la carta mantiene su precio actual ({price}).', 'Solo se encontraron {n} ventas válidas, menos de 5, así que la carta mantiene su precio actual ({price}).'), fr: P('Seulement {n} vente correspondante, moins de 5 : la carte conserve son prix actuel ({price}).', 'Seulement {n} ventes correspondantes, moins de 5 : la carte conserve son prix actuel ({price}).'), ja: '一致する販売は{n}件のみで5件未満のため、現在の価格のままです({price})。', zh: '仅找到 {n} 笔匹配成交,少于 5 笔,因此该卡保持当前价格({price})。' },
  'המכירות שנמצאו': { en: 'Sales found', es: 'Ventas encontradas', fr: 'Ventes trouvées', ja: '見つかった販売', zh: '找到的成交' },
  'ממוצע של {n} המכירות האחרונות': { en: 'Average of the last {n} sales', es: 'Media de las últimas {n} ventas', fr: 'Moyenne des {n} dernières ventes', ja: '直近{n}件の販売の平均', zh: '最近 {n} 笔成交的平均价' },
  'מחיר מכירות קודם': { en: 'Previous sales price', es: 'Precio de ventas anterior', fr: 'Ancien prix des ventes', ja: '以前の販売価格', zh: '之前的成交价' },
  'מחיר Collectr': { en: 'Collectr price', es: 'Precio de Collectr', fr: 'Prix Collectr', ja: 'Collectr 価格', zh: 'Collectr 价格' },
  'המכירות שנכללו': { en: 'Included sales', es: 'Ventas incluidas', fr: 'Ventes retenues', ja: '対象の販売', zh: '纳入的成交' },
  '{n} תוצאות לא נכללו': { en: P('{n} result not included', '{n} results not included'), es: P('{n} resultado no incluido', '{n} resultados no incluidos'), fr: P('{n} résultat non retenu', '{n} résultats non retenus'), ja: '対象外の結果 {n}件', zh: '{n} 条结果未纳入' },
  'מכירות פומביות מ-eBay': { en: 'eBay auctions', es: 'Subastas de eBay', fr: 'Enchères eBay', ja: 'eBay オークション', zh: 'eBay 拍卖' },
  'שמירה ולקלף הבא': { en: 'Save and next card', es: 'Guardar y siguiente carta', fr: 'Enregistrer et carte suivante', ja: '保存して次のカードへ', zh: '保存并转到下一张' },
  'חזרה למחיר Collectr': { en: 'Back to Collectr price', es: 'Volver al precio de Collectr', fr: 'Revenir au prix Collectr', ja: 'Collectr 価格に戻す', zh: '恢复 Collectr 价格' },
  '{name}: {price} לפי {n} מכירות': { en: '{name}: {price} from {n} sales', es: '{name}: {price} según {n} ventas', fr: '{name} : {price} selon {n} ventes', ja: '{name}: {n}件の販売に基づき {price}', zh: '{name}:按 {n} 笔成交计 {price}' },
  '{name} חזר למחיר של Collectr': { en: '{name} is back on the Collectr price', es: '{name} ha vuelto al precio de Collectr', fr: '{name} est revenu au prix Collectr', ja: '{name} を Collectr 価格に戻しました', zh: '{name} 已恢复为 Collectr 价格' },
  'נמצאו רק {n} מכירות מתאימות, פחות מ-5, ולכן הקלף מתומחר לפי Collectr ({price}). הוא ייבדק שוב בעדכון הבא.': { en: P('Only {n} matching sale found, fewer than 5, so the card uses the Collectr price ({price}). It will be checked again on the next update.', 'Only {n} matching sales found, fewer than 5, so the card uses the Collectr price ({price}). It will be checked again on the next update.'), es: P('Solo se encontró {n} venta válida, menos de 5, así que la carta usa el precio de Collectr ({price}). Se comprobará de nuevo en la próxima actualización.', 'Solo se encontraron {n} ventas válidas, menos de 5, así que la carta usa el precio de Collectr ({price}). Se comprobará de nuevo en la próxima actualización.'), fr: P('Seulement {n} vente correspondante, moins de 5 : la carte utilise le prix Collectr ({price}). Elle sera revérifiée à la prochaine mise à jour.', 'Seulement {n} ventes correspondantes, moins de 5 : la carte utilise le prix Collectr ({price}). Elle sera revérifiée à la prochaine mise à jour.'), ja: '一致する販売は{n}件のみで5件未満のため、Collectr 価格({price})を使用しています。次回の更新で再度確認します。', zh: '仅找到 {n} 笔匹配成交,少于 5 笔,因此该卡按 Collectr 价格({price})计价。下次更新时将再次检查。' },
  'המכירות שנמצאו (לא נספרו)': { en: 'Sales found (not counted)', es: 'Ventas encontradas (no contabilizadas)', fr: 'Ventes trouvées (non comptées)', ja: '見つかった販売(計算対象外)', zh: '找到的成交(未计入)' },
  'עודכן {when}. ממוצע מכירות {avg}, מחיר Collectr {price}.': { en: 'Updated {when}. Sales average {avg}, Collectr price {price}.', es: 'Actualizado: {when}. Media de ventas {avg}, precio de Collectr {price}.', fr: 'Mis à jour : {when}. Moyenne des ventes {avg}, prix Collectr {price}.', ja: '更新: {when}。販売平均 {avg}、Collectr 価格 {price}。', zh: '更新于{when}。成交均价 {avg},Collectr 价格 {price}。' },
  ' חזרה למחיר Collectr תחזיק עד העדכון האוטומטי הבא.': { en: ' Going back to the Collectr price lasts until the next automatic update.', es: ' Volver al precio de Collectr dura hasta la próxima actualización automática.', fr: ' Le retour au prix Collectr dure jusqu’à la prochaine mise à jour automatique.', ja: ' Collectr 価格に戻した場合、次回の自動更新まで有効です。', zh: ' 恢复 Collectr 价格的效果持续到下次自动更新。' },
  'עדכון מ-eBay': { en: 'Update from eBay', es: 'Actualizar desde eBay', fr: 'Mettre à jour depuis eBay', ja: 'eBay から更新', zh: '从 eBay 更新' },

  // Portfolios
  'עדכון מחירי מדורגים רץ כרגע, אפשר לעבור תיק בסיומו': { en: 'A graded price update is running. You can switch portfolios when it finishes.', es: 'Hay una actualización de graduadas en curso. Podrás cambiar de cartera cuando termine.', fr: 'Une mise à jour des prix des gradées est en cours. Vous pourrez changer de portefeuille une fois terminée.', ja: '鑑定カード価格を更新中です。完了後にポートフォリオを切り替えられます。', zh: '评级卡价格更新正在运行,完成后可切换投资组合。' },
  'שם התיק': { en: 'Portfolio name', es: 'Nombre de la cartera', fr: 'Nom du portefeuille', ja: 'ポートフォリオ名', zh: '投资组合名称' },
  'פתוח עכשיו': { en: 'open now', es: 'abierta ahora', fr: 'ouvert', ja: '表示中', zh: '当前打开' },
  'הסרה': { en: 'Remove', es: 'Quitar', fr: 'Retirer', ja: '削除', zh: '移除' },
  'נמצא הפרופיל של <b>{user}</b>. איזה תיק לעקוב?': { en: 'Found the profile of <b>{user}</b>. Which portfolio should be tracked?', es: 'Se encontró el perfil de <b>{user}</b>. ¿Qué cartera quieres seguir?', fr: 'Profil de <b>{user}</b> trouvé. Quel portefeuille suivre ?', ja: '<b>{user}</b> のプロフィールが見つかりました。どのポートフォリオを追跡しますか?', zh: '已找到 <b>{user}</b> 的个人资料。要追踪哪个投资组合?' },
  'תיק': { en: 'Portfolio', es: 'Cartera', fr: 'Portefeuille', ja: 'ポートフォリオ', zh: '投资组合' },
  'ראשי': { en: 'main', es: 'principal', fr: 'principal', ja: 'メイン', zh: '主要' },
  'כבר במעקב': { en: 'already tracked', es: 'ya en seguimiento', fr: 'déjà suivi', ja: '追跡中', zh: '已在追踪' },
  'שם במעקב': { en: 'Tracking name', es: 'Nombre de seguimiento', fr: 'Nom de suivi', ja: '追跡名', zh: '追踪名称' },
  'הוספת התיק': { en: 'Add portfolio', es: 'Añadir cartera', fr: 'Ajouter le portefeuille', ja: 'ポートフォリオを追加', zh: '添加投资组合' },
  'התיקים במעקב': { en: 'Tracked portfolios', es: 'Carteras en seguimiento', fr: 'Portefeuilles suivis', ja: '追跡中のポートフォリオ', zh: '追踪中的投资组合' },
  'לכל תיק נשמרים בנפרד המוצרים, הרכישות וההיסטוריה. שינוי שם נשמר כשיוצאים מהשדה.': { en: 'Products, purchases and history are kept separately for each portfolio. A new name is saved when you leave the field.', es: 'Los productos, las compras y el historial se guardan por separado en cada cartera. El nombre se guarda al salir del campo.', fr: 'Les produits, les achats et l’historique sont conservés séparément pour chaque portefeuille. Un nouveau nom est enregistré quand vous quittez le champ.', ja: '商品、購入、履歴はポートフォリオごとに別々に保存されます。名前の変更は入力欄から移動すると保存されます。', zh: '每个投资组合的产品、购买记录和历史都单独保存。离开输入框时会保存新名称。' },
  'הוספת תיק': { en: 'Add a portfolio', es: 'Añadir una cartera', fr: 'Ajouter un portefeuille', ja: 'ポートフォリオの追加', zh: '添加投资组合' },
  'קישור לפרופיל ב-Collectr': { en: 'Link to a Collectr profile', es: 'Enlace a un perfil de Collectr', fr: 'Lien vers un profil Collectr', ja: 'Collectr プロフィールのリンク', zh: 'Collectr 个人资料链接' },
  'בדיקת הקישור': { en: 'Check link', es: 'Comprobar enlace', fr: 'Vérifier le lien', ja: 'リンクを確認', zh: '检查链接' },
  'השם נשמר': { en: 'Name saved', es: 'Nombre guardado', fr: 'Nom enregistré', ja: '名前を保存しました', zh: '名称已保存' },
  'להסיר את "{name}" מהמעקב? הנתונים שלו נשארים שמורים במחשב, אבל הוא לא יופיע באפליקציה.': { en: 'Stop tracking "{name}"? Its data stays saved on this computer, but it won’t appear in the app.', es: '¿Dejar de seguir "{name}"? Sus datos seguirán guardados en el ordenador, pero no aparecerá en la aplicación.', fr: 'Ne plus suivre « {name} » ? Ses données restent enregistrées sur l’ordinateur, mais il n’apparaîtra plus dans l’application.', ja: '「{name}」の追跡をやめますか?データはこのコンピューターに残りますが、アプリには表示されなくなります。', zh: '要停止追踪“{name}”吗?其数据仍保存在电脑上,但不会显示在应用中。' },
  'ההסרה נכשלה: {msg}': { en: 'Removal failed: {msg}', es: 'Error al quitar: {msg}', fr: 'Échec du retrait : {msg}', ja: '削除に失敗しました: {msg}', zh: '移除失败:{msg}' },
  'זה לא נראה קישור לפרופיל ב-Collectr. הקישור צריך להכיל showcase/profile/@': { en: 'This doesn’t look like a Collectr profile link. It should contain showcase/profile/@', es: 'No parece un enlace de perfil de Collectr. Debe contener showcase/profile/@', fr: 'Ceci ne ressemble pas à un lien de profil Collectr. Il doit contenir showcase/profile/@', ja: 'Collectr のプロフィールリンクではないようです。showcase/profile/@ を含むリンクを入力してください', zh: '这看起来不是 Collectr 个人资料链接。链接应包含 showcase/profile/@' },
  'לא הצלחתי לקרוא את הפרופיל. ודא שהקישור נכון ושהתיק מוצג לציבור ב-Collectr. ({msg})': { en: 'Could not read the profile. Make sure the link is correct and the portfolio is public on Collectr. ({msg})', es: 'No se pudo leer el perfil. Comprueba que el enlace sea correcto y que la cartera sea pública en Collectr. ({msg})', fr: 'Impossible de lire le profil. Vérifiez que le lien est correct et que le portefeuille est public sur Collectr. ({msg})', ja: 'プロフィールを読み取れませんでした。リンクが正しいこと、Collectr でポートフォリオが公開されていることを確認してください。({msg})', zh: '无法读取个人资料。请确认链接正确,且投资组合在 Collectr 上公开。({msg})' },
  'התיק הזה כבר במעקב. בחר תיק אחר.': { en: 'This portfolio is already tracked. Choose another one.', es: 'Esta cartera ya está en seguimiento. Elige otra.', fr: 'Ce portefeuille est déjà suivi. Choisissez-en un autre.', ja: 'このポートフォリオはすでに追跡中です。別のものを選択してください。', zh: '此投资组合已在追踪中。请选择其他投资组合。' },
  'ההוספה נכשלה: {msg}': { en: 'Adding failed: {msg}', es: 'Error al añadir: {msg}', fr: 'Échec de l’ajout : {msg}', ja: '追加に失敗しました: {msg}', zh: '添加失败:{msg}' },
};

function storedLang() {
  try { return localStorage.getItem('lang'); } catch { return null; } // Storage may be blocked.
}
let lang = LANGS.some((l) => l.code === storedLang()) ? storedLang() : 'he';
let i18nOnChange = () => {};

function tr(key, params) {
  let text = lang === 'he' ? key : (I18N[key]?.[lang] ?? key);
  if (typeof text === 'object') {
    const count = parseFloat(String(params?.n).replace(/,/g, ''));
    text = text[new Intl.PluralRules(lang).select(count)] || text.other;
  }
  return params ? text.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m)) : text;
}
// A message saved in the app's data: either a key or { k: key, p: params }, so it follows the language.
const tm = (v) => (v && typeof v === 'object' ? tr(v.k, v.p) : tr(v));
// A translated string as JavaScript source, for the bookmarks.
const jsq = (key) => JSON.stringify(tr(key));
const langDir = () => LANGS.find((l) => l.code === lang).dir;

// The page's fixed Hebrew text, remembered before anything changes it.
const staticText = [];
(function collectStaticText() {
  const hebrew = /[֐-׿]/;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (hebrew.test(node.nodeValue) && node.parentElement.tagName !== 'SCRIPT') {
      staticText.push({ node, key: node.nodeValue.trim() });
    }
  }
  document.querySelectorAll('[aria-label], [placeholder]').forEach((el) => {
    for (const attr of ['aria-label', 'placeholder']) {
      const key = el.getAttribute(attr);
      if (key && hebrew.test(key)) staticText.push({ el, attr, key });
    }
  });
})();

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = langDir();
  for (const s of staticText) {
    if (s.node) s.node.nodeValue = tr(s.key);
    else s.el.setAttribute(s.attr, tr(s.key));
  }
}
function setLang(code) {
  lang = code;
  try { localStorage.setItem('lang', code); } catch { /* only a convenience */ }
  applyLang();
  i18nOnChange();
}

const langSelect = document.getElementById('langSelect');
langSelect.innerHTML = LANGS.map((l) => `<option value="${l.code}" ${l.code === lang ? 'selected' : ''}>${l.name}</option>`).join('');
langSelect.addEventListener('change', (e) => setLang(e.target.value));
applyLang();
