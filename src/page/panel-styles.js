// Shared workbench presentation, isolated from EA styles by the panel shadow root.
(function (root) {
  const styles = `
    .gallery-trades { --trade-ink: #172B46; --trade-muted: #53657D; --trade-line: #CDD7E5; --trade-surface: #FFFFFF; color: var(--trade-ink); border-top: 1px solid var(--trade-line); padding-top: 20px; gap: 12px; }
    .trade-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .trade-eyebrow { display: block; font: 600 10px/1.4 'Segoe UI', system-ui, sans-serif; letter-spacing: .12em; color: #2864DC; }
    .gallery-trades .trade-heading h3 { font: 650 22px/1.2 'Bahnschrift', 'Segoe UI', system-ui, sans-serif; letter-spacing: -.03em; text-transform: none; margin: 5px 0 0; color: var(--trade-ink); }
    .trade-count { flex: none; border: 1px solid var(--trade-line); border-radius: 100px; padding: 5px 10px; color: var(--trade-muted); font-size: 12px; }
    .trade-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); background: var(--trade-surface); border: 1px solid var(--trade-line); border-radius: 12px; overflow: hidden; }
    .trade-metrics > div { min-width: 0; padding: 14px 10px; display: grid; gap: 7px; align-content: start; }
    .trade-metrics > div + div { border-left: 1px solid var(--trade-line); }
    .trade-metrics span { font-size: 9px; font-weight: 650; letter-spacing: .06em; color: var(--trade-muted); }
    .trade-metrics strong { font: 650 21px/1.1 'Consolas', ui-monospace, monospace; letter-spacing: -.05em; }
    .trade-metrics small { font-size: 10px; line-height: 1.4; color: var(--trade-muted); }
    .trade-batch { display: grid; gap: 7px; }
    .gallery-trades .trade-batch button { min-height: 42px; text-align: left; font-size: 12px; font-weight: 600; padding: 10px 12px; }
    .workflow-budget { display: grid; gap: 7px; font-size: 12px; color: #2856A9; padding: 8px 0; }
    .gallery-trades .workflow-budget input { width: 100%; }
    .trade-progress { display: grid; gap: 7px; border-left: 3px solid #2864DC; background: var(--trade-surface); border-radius: 0 8px 8px 0; padding: 12px; font-size: 12px; line-height: 1.5; }
    .trade-progress span { color: var(--trade-muted); }
    .trade-settings { color: var(--trade-muted); font-size: 12px; border-top: 1px solid var(--trade-line); padding-top: 10px; }
    .trade-settings > summary { cursor: pointer; padding: 4px 0 10px; }
    .easy-gallery { padding: 16px; border: 1px solid #CDD7E5; border-radius: 12px; background: #FFFFFF; }
    .easy-gallery .trade-heading h3 { margin: 4px 0; font-size: 19px; color: #172B46; text-transform: none; letter-spacing: -.02em; }
    .easy-controls, .easy-preview { display: grid; gap: 10px; }
    .easy-controls label { display: grid; gap: 6px; min-width: 0; font-size: 12px; }
    .easy-controls select { min-width: 0; max-width: 100%; }
    .easy-preview { border-top: 1px solid #CDD7E5; padding-top: 12px; font-size: 13px; }
    .easy-preview summary { cursor: pointer; color: #2856A9; }
    .easy-preview ul { max-height: 240px; overflow: auto; padding-left: 18px; line-height: 1.7; }
    .easy-preview a { color: #2856A9; }
    .manual-slot-actions { display: flex; justify-content: center; gap: 3px; flex-wrap: wrap; max-width: 116px; }
    .manual-slot-actions button { font-size: 9px; padding: 3px 5px; line-height: 1.3; }
    .manual-squad-picker { padding: 14px; border: 1px solid #2864DC; border-radius: 10px; background: #FFFFFF; }
    .manual-squad-picker input[type=search] { width: 100%; min-width: 0; font: inherit; padding: 9px; color: #172B46; background: #FFFFFF; border: 1px solid #CDD7E5; border-radius: 6px; }
    .manual-player-list { display: grid; gap: 6px; max-height: 300px; overflow-y: auto; }
    .manual-player-row { display: grid; gap: 4px; text-align: left; }
    .manual-player-row span { color: #53657D; font-size: 11px; }
    .gallery-trades .trade-entry { border: 1px solid var(--trade-line); border-radius: 10px; padding: 0 12px 10px; overflow: hidden; }
    .gallery-trades .trade-entry:not([open]) { padding-bottom: 0; }
    .trade-entry summary { display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 600; line-height: 1.5; padding: 12px 0; list-style: none; }
    .trade-entry summary::-webkit-details-marker { display: none; }
    .trade-entry summary::after { content: '+'; color: var(--trade-muted); font-size: 18px; }
    .trade-entry[open] summary::after { content: '−'; }
    .trade-rating { display: grid; place-items: center; flex: none; width: 32px; height: 37px; border: 1px solid #867551; border-radius: 5px 5px 10px 10px; color: #76540F; background: #FFF7DE; font: 700 17px/1 'Consolas', monospace; }
    .trade-card-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
    .trade-badge { flex: none; color: #2856A9; background: #EAF0FF; padding: 3px 7px; border-radius: 100px; font-size: 10px; }
    .trade-badge.done { color: #13734F; background: #E4F5EC; }
    .gallery-trades .trade-entry .row { gap: 6px; }
    .gallery-trades .trade-entry button { font-size: 11px; padding: 7px 9px; }
    .trade-prices { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .trade-prices label, .trade-tax { display: grid; gap: 6px; font-size: 12px; }
    .trade-prices input, .trade-tax input { width: 100%; min-width: 0; }
    .trade-tax { max-width: 200px; }
    .trade-summary { display: grid; gap: 6px; padding: 12px 0; font-variant-numeric: tabular-nums; }
    :host { all: initial; --ff-paper: #F2F5FA; --ff-surface: #FFFFFF; --ff-ink: #172B46; --ff-muted: #53657D; --ff-line: #CDD7E5; --ff-action: #1659D5; }
    * { box-sizing: border-box; }
    /* Scroll bars in the panel's colours: a thin rounded thumb on no track, lighter on hover and
       violet while dragged. */
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track, ::-webkit-scrollbar-corner { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #CDD7E5; background-clip: padding-box; border: 3px solid transparent; border-radius: 999px; min-height: 40px; }
    ::-webkit-scrollbar-thumb:hover { background-color: #4A4170; }
    ::-webkit-scrollbar-thumb:active { background-color: #2864DC; }
    .toggle { position: fixed; right: 24px; bottom: 24px; z-index: 2147483000; border: 0; border-radius: 999px;
      padding: 8px 16px 8px 10px; font: 700 14px/1 system-ui, sans-serif; letter-spacing: .04em; cursor: pointer;
      display: flex; align-items: center; gap: 8px; background: #14243A; color: #fff; box-shadow: 0 0 0 1px #2864DC, 0 4px 14px rgba(0,0,0,.35); }
    .fox { width: 24px; height: 24px; flex: none; }
    header .fox { width: 30px; height: 30px; }
    .brand { display: flex; align-items: center; gap: 10px; }
    .toggle:focus-visible, button:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid #1659D5; outline-offset: 2px; }
    /* Never narrower than the default, never wider than the screen; the grip on the left edge resizes it. */
    .panel { position: fixed; top: 0; right: 0; bottom: 0; width: var(--futfox-width, 520px); min-width: min(520px, 100vw); max-width: 100vw;
      z-index: 2147483001; display: flex; flex-direction: column; overflow: hidden;
      background: #F2F5FA; color: #172B46; font: 15px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; box-shadow: -8px 0 24px rgba(0,0,0,.45); }
    .grip { position: absolute; top: 0; bottom: 0; left: 0; width: 8px; cursor: ew-resize; touch-action: none; z-index: 1; }
    .grip:hover, .grip:focus-visible, .grip.dragging { background: linear-gradient(90deg, transparent 3px, #2864DC 3px, #2864DC 5px, transparent 5px); outline: none; }
    .panel[hidden], .toggle[hidden], .dock[hidden] { display: none; }
    /* While one of them shrinks away, clicks go to what is under it. */
    .leaving { pointer-events: none; }
    /* Drag and drop: the button, the placing card and the panel's header pick them up. */
    .toggle, .dock, header { touch-action: none; user-select: none; }
    .dock, header { cursor: grab; }
    .dragging, .dragging header { cursor: grabbing; }
    .dragging { opacity: .92; }
    /* Once moved, the panel floats: full height until it is resized from its bottom-right corner. */
    .panel.moved { bottom: auto; height: 100vh; min-height: 280px; max-height: 100vh; border-radius: 10px; overflow: hidden; resize: both;
      box-shadow: 0 0 0 1px #CDD7E5, 0 12px 32px rgba(0,0,0,.5); }
    .panel.moved .grip { display: none; }
    /* The placing list, in the corner where the FutFox button sits: one line with the next player, or every player above it. */
    .dock { position: fixed; right: 24px; bottom: 16px; z-index: 2147483000; width: 360px; max-height: calc(100vh - 32px); display: flex; flex-direction: column;
      border-radius: 10px; background: #F2F5FA; color: #172B46; font: 13px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif;
      box-shadow: 0 0 0 1px #2864DC, 0 8px 24px rgba(0,0,0,.45); overflow: hidden; }
    .dock button { padding: 2px 8px; font-size: 12px; }
    /* A checklist: progress on top, then one row per card (small card, name, where to find it,
       Copy and a round tick), placed rows faded. */
    .dock-progress { flex: none; height: 3px; background: #DCE4EF; }
    /* Full width, scaled to the share placed, so a tick can grow it smoothly. */
    .dock-progress i { display: block; height: 100%; background: #1659D5; transform-origin: left; }
    .dock-head { padding: 8px 12px 4px; font-size: 12px; color: #53657D; }
    .dock-head strong { color: #172B46; font-weight: 600; }
    .dock-bar { display: flex; align-items: center; gap: 6px; padding: 6px 6px 6px 8px; }
    .dock-list + .dock-bar { border-top: 1px solid #DCE4EF; }
    .dock .fox-btn { border: 0; background: none; padding: 2px; display: grid; }
    .dock .fox-btn .fox { width: 22px; height: 22px; }
    .dock .close { font-size: 20px; padding: 0 6px; height: 28px; }
    .dock-bar .icon-btn svg { width: 16px; height: 16px; }
    .dock-bar .count { flex: 1; color: #53657D; font-variant-numeric: tabular-nums; }
    .dock-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; }
    .dock-row { display: flex; align-items: center; gap: 10px; min-width: 0; font-variant-numeric: tabular-nums; }
    .dock-list .dock-row { padding: 6px 10px; border-top: 1px solid #EAF0FF; }
    .dock-list .dock-row:first-child { border-top: 0; }
    .dock-bar .dock-row { flex: 1; }
    .dock-row .card.small { width: 26px; }
    .dock-row .who { flex: 1; min-width: 0; display: grid; }
    .dock .name { position: relative; justify-self: start; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-weight: 600; }
    /* Isolated, so in Arabic the rating sits before a Latin name instead of running into it. */
    .dock .name .r { margin-inline-end: 6px; unicode-bidi: isolate; }
    .dock .sub { font-size: 12px; color: #53657D; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .dock .sub .store { color: #8cc4ff; }
    .dock .sub .pts { color: #172B46; font-weight: 600; }
    .dock .sub .pts-icon { width: 12px; height: 12px; margin-inline-end: 3px; vertical-align: -2px; }
    .dock .icon-btn { margin: 0; width: 28px; height: 28px; }
    .dock button.tick { flex: none; width: 24px; height: 24px; padding: 0; border-radius: 50%; border: 2px solid #CDD7E5; background: none; display: grid; place-items: center; color: #FFFFFF; font-size: 13px; font-weight: 800; line-height: 1; }
    .dock button.tick:hover { border-color: #1659D5; }
    .dock button.tick[aria-checked=true] { background: #1659D5; border-color: #1659D5; }
    .dock-row.placed > :not(.tick) { opacity: .45; }
    /* A line through the name, drawn from the left when the card is ticked. */
    .dock-row.placed .name::after { content: ""; position: absolute; left: 0; right: 0; top: 52%; height: 1.5px; background: currentColor; transform-origin: left; }
    .dock-bar .done { flex: 1; color: #13734F; }
    header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #DCE4EF; }
    h1 { margin: 0; font-size: 18px; font-weight: 700; }
    h2 { margin: 0 0 8px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #53657D; }
    .body { flex: 1; overflow-y: auto; padding: 16px; display: grid; gap: 18px; align-content: start; }
    section { display: grid; gap: 8px; }
    select, input[type=number] { width: 100%; background: #FFFFFF; color: inherit; border: 1px solid #CDD7E5; border-radius: 6px; padding: 7px 8px; font: inherit; }
    input[type=number] { width: 72px; }
    button { font: inherit; cursor: pointer; border-radius: 6px; border: 1px solid #CDD7E5; background: #FFFFFF; color: inherit; padding: 7px 12px; }
    /* Lime marks the main action, as on the website; violet stays for opening the market. */
    button.primary { background: #1659D5; color: #FFFFFF; border-color: #1659D5; font-weight: 700; }
    button.primary:not(:disabled):hover { background: #124AB4; border-color: #124AB4; }
    /* Faded lime reads as olive, so a disabled main button goes grey instead. */
    button.primary:disabled { opacity: 1; background: #FFFFFF; border-color: #CDD7E5; color: #64748B; }
    button.market { background: #2864DC; color: #fff; border-color: #2864DC; font-weight: 700; }
    button:disabled { opacity: .5; cursor: default; }
    .close { border: 0; background: none; font-size: 24px; line-height: 1; padding: 4px 8px; color: #53657D; }
    .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    input[type=checkbox] { accent-color: #1659D5; }
    .muted { color: #53657D; }
    ul.rules { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
    ol.steps { margin: 0; padding-inline-start: 20px; display: grid; gap: 6px; color: #425774; }
    ul.rules li { display: grid; grid-template-columns: 22px 1fr; gap: 6px; }
    .ok { color: #13734F; } .bad { color: #BA3545; } .unknown { color: #8A5A08; }
    .summary { display: flex; flex-wrap: wrap; gap: 6px 14px; padding: 10px 12px; border-radius: 8px; background: #FFFFFF; font-variant-numeric: tabular-nums; }
    .summary strong { font-size: 17px; }
    table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
    td { padding: 7px 5px; border-bottom: 1px solid #E1E8F1; vertical-align: middle; }
    td.pos { color: #53657D; width: 48px; font-size: 13px; }
    td.r { width: 34px; font-weight: 700; }
    .name { display: block; font-weight: 600; }
    .meta { display: block; font-size: 13px; color: #53657D; }
    .tag { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; padding: 2px 6px; border-radius: 999px; background: #DCE4EF; color: #425774; white-space: nowrap; }
    .tag.buy { background: #2A1F4D; color: #2856A9; }
    .tag.untr { background: #E4F5EC; color: #13734F; }
    /* A suggested card: untradeable, points or chemistry and Change on one line, then where it is. */
    /* As wide as the card's art (about 80% of its box), so the line starts and ends at its corners. */
    .pick-line { display: flex; align-items: center; gap: 4px; width: 80%; max-width: 128px; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .pick-line .pts-icon { width: 14px; height: 14px; }
    .untr-ico { font-family: UltimateTeam-Icons, sans-serif; font-weight: 400; font-size: 14px; line-height: 1; color: #425774; }
    /* The game's untradeable glyph from its own icon font (the backslash is doubled for the template). */
    .untr-ico::before { content: '\\e0ea'; }
    button.icon-btn { margin-inline-start: auto; display: grid; place-items: center; width: 26px; height: 26px; padding: 0; color: #425774; }
    button.icon-btn:hover { border-color: #2864DC; color: #1659D5; }
    button.icon-btn svg { width: 14px; height: 14px; }
    .pick .src { font-size: 11px; color: #53657D; }
    .pick .src.store { color: #8cc4ff; }
    /* A squad SBC's cards on a pitch, in the formation's lines; each line centred. */
    .pitch { display: grid; gap: 14px; padding: 14px 10px; border: 1px solid #1f3a2a; border-radius: 12px; background: #10201a; }
    .pitch-row { display: flex; justify-content: center; gap: 8px; }
    .pitch-row > .slot { flex: 0 1 calc((100% - 32px) / 5); max-width: 140px; min-width: 0; }
    .slot.locked .card { opacity: .45; }
    .slot.dim { opacity: .3; }
    .rule-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .rule-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border: 1px solid #DCE4EF; border-radius: 999px; background: #FFFFFF; font-size: 13px; color: #425774; }
    button.rule-chip:hover { border-color: #2864DC; }
    button.rule-chip[aria-pressed=true] { border-color: #1659D5; color: #1659D5; }
    .rule-chip .ri { font-weight: 700; }
    .rule-chip.ok .ri { color: #13734F; } .rule-chip.bad .ri { color: #BA3545; } .rule-chip.unknown .ri { color: #53657D; }
    /* A card's chemistry as the game shows it: three diamonds on a round badge, lit for each point. */
    .chem-pts { position: relative; flex: none; width: 20px; height: 20px; border-radius: 50%; background: #1d272f; border: 1px solid #333d47; }
    .chem-pts i { position: absolute; font: normal 400 7px/1 UltimateTeam-Icons, sans-serif; color: #fff; opacity: .3; }
    .chem-pts i::before { content: '\\e031'; }
    .chem-pts i.on { opacity: 1; }
    .chem-pts i:nth-child(1) { left: 3px; bottom: 4px; }
    .chem-pts i:nth-child(2) { left: 50%; top: 3px; transform: translateX(-50%); }
    .chem-pts i:nth-child(3) { right: 3px; bottom: 4px; }
    button.small { padding: 4px 10px; font-size: 13px; white-space: nowrap; }
    .note { font-size: 13px; color: #53657D; }
    .error { color: #BA3545; }
    .tabs { position: relative; display: flex; gap: 4px; padding: 10px 16px 0; border-bottom: 1px solid #DCE4EF; }
    /* The selected tab's underline, one bar that slides from tab to tab. */
    .tabs .ink { position: absolute; left: 0; bottom: -1px; width: 1px; height: 2px; background: #1659D5; transform-origin: left; pointer-events: none; }
    .tabs button { border: 0; border-bottom: 2px solid transparent; border-radius: 0; background: none; color: #53657D; padding: 8px 10px; font-weight: 600; }
    .tabs button[aria-selected="true"] { color: #1659D5; background: #EAF0FF; border-radius: 8px 8px 0 0; }
    /* Categories, then a category's sets, as cards: one column at the panel's usual width, one more each
       time it is dragged about 370px wider, never more than four (each column is at least a quarter of the
       row), and every card in a row the same height. */
    .sets { display: grid; grid-template-columns: repeat(auto-fill, minmax(max(360px, calc((100% - 24px) / 4)), 1fr)); grid-auto-rows: 1fr; gap: 8px; }
    /* A category card: logos, tokens and set count; sets per grade; name. */
    .cat { display: grid; gap: 14px; align-content: space-between; min-width: 0; text-align: left; padding: 14px 16px; border: 1px solid #DCE4EF; border-radius: 10px; background: #FFFFFF; }
    .cat:hover, .cat:focus-visible { border-color: #2864DC; outline: none; }
    .cat-top { display: flex; align-items: center; gap: 8px; }
    .cat .logos { display: flex; align-items: center; gap: 10px; margin-inline-end: auto; min-width: 0; }
    .cat .logos img { height: 36px; max-width: 48px; object-fit: contain; }
    .cat .logos .letter { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: #DCE4EF; color: #425774; font-weight: 700; }
    .cat .tokens { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .cat .tokens img { width: 16px; height: 16px; }
    .cat .tokens strong { color: #E8C45A; }
    .cat .chip { font-size: 12px; padding: 3px 8px; border: 1px solid #CDD7E5; border-radius: 6px; background: #F2F5FA; white-space: nowrap; }
    .cat .grades { display: grid; grid-template-columns: repeat(5, 1fr); justify-items: center; }
    .grade { display: grid; justify-items: center; gap: 4px; font-variant-numeric: tabular-nums; }
    .grade .dia, .step .dia, .aimg .dia { position: relative; z-index: 0; width: 26px; height: 26px; display: grid; place-items: center; font-size: 12px; font-weight: 700; }
    .grade .dia::before, .step .dia::before, .aimg .dia::before { content: ''; position: absolute; inset: 4px; transform: rotate(45deg); border: 1.5px solid currentColor; border-radius: 3px; background: #F2F5FA; z-index: -1; }
    .grade .n { font-size: 12px; color: #425774; }
    .grade.none { opacity: .35; }
    .cat-foot { display: flex; align-items: end; justify-content: space-between; gap: 8px; }
    .cat-name { display: block; font-weight: 700; font-size: 16px; }
    .cat-sub { display: block; font-size: 13px; color: #53657D; }
    .cat .go { width: 28px; height: 28px; flex: none; display: grid; place-items: center; border-radius: 50%; border: 1px solid #CDD7E5; color: #53657D; font-size: 13px; }
    .cat:hover .go { border-color: #2864DC; color: #1659D5; }
    .set { display: grid; border: 1px solid #DCE4EF; border-radius: 8px; background: #FFFFFF; min-width: 0; }
    button.set-head:hover { background: #EAF0FF; border-radius: 8px; }
    .set-head { align-content: start; }
    .crumbs { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; font-size: 13px; }
    .crumbs button { padding: 4px 8px; font-size: 13px; }
    .crumbs .sep { color: #64748B; }
    .crumbs .current { color: #172B46; font-weight: 600; padding: 4px 2px; }
    .set-head { width: 100%; border: 0; background: none; text-align: left; display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 4px 10px; align-items: center; padding: 10px 12px; }
    /* A league logo (with the women's league small in its corner), club badge, art from art/, or a letter. */
    .pic { grid-row: 1 / 4; position: relative; width: 40px; height: 40px; display: grid; place-items: center; }
    .pic img { width: 40px; height: 40px; object-fit: contain; }
    .pic img.second { position: absolute; right: -6px; bottom: -4px; width: 20px; height: 20px; padding: 2px; border-radius: 50%; background: #FFFFFF; }
    .pic .letter { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; background: #DCE4EF; color: #425774; font-weight: 700; font-size: 16px; }
    .tabs button { display: inline-flex; align-items: center; gap: 6px; }
    .tabs img, .tabs svg { width: 16px; height: 16px; }
    .summary .coin { width: 18px; height: 18px; vertical-align: -3px; margin-inline-end: 5px; }
    .set-head .name { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow-wrap: anywhere; }
    .set-head .count { font-weight: 700; font-variant-numeric: tabular-nums; }
    .set-head .meta, .set-head .bar { grid-column: 2 / -1; }
    .bar { height: 4px; border-radius: 2px; background: #DCE4EF; overflow: hidden; }
    .bar > span { display: block; height: 100%; background: #1659D5; }
    h3 { margin: 6px 0 0; font-size: 13px; font-weight: 600; color: #425774; }
    /* One set: its grade and ladder, its cards, its bonus tags. */
    .set-page { display: grid; gap: 18px; }
    .set-page h3 { margin: 0 0 10px; text-transform: uppercase; letter-spacing: .06em; }
    .grade-panel { gap: 14px; padding: 16px; border: 1px solid #DCE4EF; border-radius: 12px; background: #FFFFFF; }
    .grade-top { display: flex; align-items: center; gap: 16px; }
    .grade.big .dia { width: 60px; height: 60px; font-size: 22px; }
    .grade.big .dia::before { inset: 9px; border-width: 2px; border-radius: 5px; background: #EAF0FF; }
    .grade-text { display: grid; gap: 2px; min-width: 0; font-size: 13px; }
    .grade-text .score { display: flex; align-items: center; gap: 6px; }
    .grade-text .score strong { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
    .grade-text .score .score-icon { width: 18px; height: 18px; }
    .pick-score strong { display: inline-flex; align-items: center; gap: 5px; }
    .pick-score .score-icon { width: 13px; height: 13px; }
    .to-next { display: grid; gap: 6px; }
    .to-next .bar > span { background: #E8C45A; }
    .ladder { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
    .ladder .step { display: grid; justify-items: center; gap: 2px; padding: 6px 2px; border-radius: 8px; font-variant-numeric: tabular-nums; }
    .ladder .step.current { background: #EAF0FF; box-shadow: inset 0 -2px 0 #1659D5; }
    .ladder .n { font-size: 12px; font-weight: 700; color: inherit; }
    .ladder .gives { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; color: #53657D; }
    .ladder .gives img { width: 13px; height: 13px; }
    .step.none { opacity: .45; }
    .g-D .dia, .g-C .dia { color: #425774; } .g-B .dia, .g-A .dia { color: #E8C45A; } .g-S .dia { color: #2864DC; }
    /* Cards drawn like the game's: five per row, growing with the panel, and one more per row each
       time a card would pass 160px wide. Their text scales with the card (cqw: % of its width). */
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(max(84px, min(160px, calc((100% - 32px) / 5))), 1fr)); gap: 12px 8px; }
    .slot { display: grid; justify-items: center; align-content: start; gap: 4px; min-width: 0; }
    .card { position: relative; width: 100%; max-width: 160px; aspect-ratio: 576 / 800; display: block; container-type: inline-size; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,.85); }
    .card.blank { color: #172B46; text-shadow: none; clip-path: polygon(50% 0, 63% 3.5%, 100% 5%, 100% 90%, 50% 100%, 0 90%, 0 5%, 37% 3.5%); background: #EAF0FF; }
    .card .bg { position: absolute; inset: 0; width: 100%; height: 100%; }
    /* The face stands on the card's divider line, 64% of the way down, above the name. */
    .card .face { position: absolute; left: 28%; bottom: 36.3%; width: 66%; }
    .card .rt { position: absolute; left: 17%; top: 21%; font-size: 16.7cqw; font-weight: 800; line-height: 1; }
    .card .ps { position: absolute; left: 17%; top: 33%; font-size: 9.5cqw; font-weight: 700; }
    .card .nm { position: absolute; left: 8%; right: 8%; top: 66%; text-align: center; font-size: 11.9cqw; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .card .lbl { position: absolute; inset: 22% 10%; display: grid; place-items: center; text-align: center; font-size: min(11.9cqw, 13px); font-weight: 600; line-height: 1.25; overflow-wrap: anywhere; }
    /* Common and rare cards are drawn narrower than special ones (10% to 91% of the image across), with
       dark text; their rating and position sit nearer the edge to clear the face. */
    .card.plain { color: #2B2210; text-shadow: none; }
    .card.plain .rt, .card.plain .ps { left: 13%; }
    .card.plain .nm { left: 14%; right: 14%; }
    /* Flag, league and club, in a row under the name as on the game's cards. */
    .card .bdg { position: absolute; left: 14%; right: 14%; top: 79%; display: flex; justify-content: center; align-items: center; gap: 5cqw; }
    .card .bdg img { height: 10cqw; max-width: 17cqw; object-fit: contain; }
    .card.missing .bg, .card.missing .face { opacity: .3; filter: grayscale(1); }
    .card.missing .rt, .card.missing .nm { opacity: .6; }
    .slot .cap { font-size: 11px; white-space: nowrap; }
    .slot .acts { display: flex; gap: 8px; }
    /* Holographic cards: EA's sweep plays across the card, 27 frames in a row; its still layer stands in when motion is off. */
    .card .holo, .card .holo-still { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .card .holo { background-repeat: no-repeat; background-size: 2700% 100%; animation: futfox-holo 2.2s steps(27, jump-none) infinite; }
    .card .holo-still { display: none; }
    .card .holo-still.only { display: block; }
    /* No EA art: a soft shine, cut to the card art's own outline. */
    .card .holo.css {
      -webkit-mask: var(--card-art) 0 0 / 100% 100% no-repeat; mask: var(--card-art) 0 0 / 100% 100% no-repeat;
      background: linear-gradient(115deg, transparent 38%, rgba(214,200,255,.35) 48%, rgba(198,255,61,.15) 53%, transparent 62%) 0 0 / 300% 100% no-repeat;
      animation: futfox-shine 3s linear infinite;
    }
    @keyframes futfox-holo { from { background-position: 0% 0; } to { background-position: 100% 0; } }
    @keyframes futfox-shine { from { background-position: 100% 0; } to { background-position: 0% 0; } }
    /* Busy: a spinning ring beside the text, and faded cards pulsing where the result will go.
       Only rotation and opacity move, so they keep going while a squad search blocks the page. */
    .spin { display: inline-block; flex: none; width: 12px; height: 12px; margin-inline-end: 8px; vertical-align: -2px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: futfox-spin .7s linear infinite; }
    .muted .spin, p .spin { color: #1659D5; }
    .slot.skel .card, .skel-box, .cat.skel { animation: futfox-pulse 1.2s ease-in-out infinite; }
    .skel-box { display: block; height: 10px; border-radius: 5px; background: #DCE4EF; }
    .cat.skel { min-height: 150px; }
    .pick-skel { display: flex; align-items: center; gap: 12px; padding: 6px 12px 6px 8px; border: 1px solid #DCE4EF; border-radius: 8px; }
    .skel-text { display: grid; gap: 8px; flex: 1; }
    /* Loading the club: one bordered line with the spinner, and a counter that climbs page by page. */
    .club-loading { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid #CDD7E5; border-radius: 6px; color: #425774; }
    .club-loading .spin { margin-inline-end: 0; color: #1659D5; }
    .club-loading .club-count { margin-inline-start: auto; color: #53657D; font-variant-numeric: tabular-nums; }
    .club-pointer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border: 1px dashed #CDD7E5; border-radius: 8px; font-size: 13px; color: #425774; }
    button.load { transition: transform .1s; }
    button.load:active { transform: scale(.97); }
    @keyframes futfox-spin { to { transform: rotate(360deg); } }
    @keyframes futfox-pulse { 50% { opacity: .35; } }
    @media (prefers-reduced-motion: reduce) {
      .spin { animation-duration: 2s; }
      .slot.skel .card, .skel-box, .cat.skel { animation: none; opacity: .6; }
      .card .holo { animation: none; }
      .card .holo.has-still { display: none; }
      .card .holo-still { display: block; }
    }
    .card.small { width: 44px; flex: none; }
    .card.small .rt, .card.small .ps, .card.small .nm { display: none; }
    /* Pick player: the cards that fit a slot, one row each. */
    .picker { display: grid; gap: 12px; }
    .picker-head { display: grid; gap: 2px; }
    .picker-head .name { font-weight: 700; font-size: 16px; }
    .picker form input { flex: 1; min-width: 0; background: #FFFFFF; color: inherit; border: 1px solid #CDD7E5; border-radius: 6px; padding: 7px 8px; font: inherit; }
    .picks { display: grid; gap: 6px; }
    button.pick { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 6px 12px 6px 8px; border-color: #DCE4EF; }
    button.pick:hover, button.pick:focus-visible { border-color: #2864DC; }
    button.pick.chosen { border-color: #1659D5; }
    .pick-text { flex: 1; min-width: 0; }
    .pick-score { display: grid; justify-items: end; font-variant-numeric: tabular-nums; font-size: 12px; }
    .pick-score strong { font-size: 15px; }
    button.link { border: 0; background: none; padding: 0; font-size: 11px; color: #2856A9; text-decoration: underline; text-underline-offset: 2px; }
    /* Suggest: pick a grade (its diamond), and the cards that would reach it fill the empty slots. */
    .suggest { display: grid; gap: 8px; margin-bottom: 12px; }
    .suggest .aim { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .suggest .aim .label { font-size: 13px; color: #425774; margin-inline-end: 4px; }
    button.aimg { display: grid; place-items: center; width: 44px; height: 44px; padding: 0; background: none; border-color: #DCE4EF; border-radius: 8px; }
    button.aimg:hover, button.aimg:focus-visible { border-color: #2864DC; }
    button.aimg[aria-pressed="true"] { border-color: #1659D5; background: #EAF0FF; }
    .suggest .sum { font-size: 13px; color: #425774; font-variant-numeric: tabular-nums; }
    .suggest .sum strong.reached { color: #1659D5; }
    .slot.suggested .card { outline: 1.5px dashed #1659D5; outline-offset: 3px; border-radius: 4px; }
    .slot .cap.sug { color: #1659D5; font-weight: 700; direction: ltr; unicode-bidi: isolate; }
    .slot .src { font-size: 10px; color: #2856A9; white-space: nowrap; }
    .slot .src.club { color: #13734F; }
    button.link:hover { color: #1659D5; }
    .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    .tags { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; }
    .tagc { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid #DCE4EF; border-radius: 10px; background: #FFFFFF; }
    .tagc.near { border-style: dashed; border-color: #CDD7E5; background: none; }
    .tagc.near strong { color: #425774; }
    .tagc strong { display: block; font-size: 14px; }
    .tagc .meta { font-size: 12px; }
    .tag-icon { width: 26px; height: 26px; flex: none; }
    label.file { position: relative; display: inline-block; border-radius: 6px; border: 1px solid #CDD7E5; background: #FFFFFF; padding: 7px 12px; cursor: pointer; }
    label.file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; }
    label.file:focus-within { outline: 2px solid #2864DC; }
    footer { padding: 10px 16px; border-top: 1px solid #DCE4EF; font-size: 13px; color: #53657D; }
    /* The challenge picker: a button that opens a searchable list grouped by SBC set. */
    .menu { position: relative; }
    .menu-btn { width: 100%; display: flex; align-items: center; gap: 10px; text-align: left; padding: 8px 10px; }
    .menu-btn:hover, .menu-btn[aria-expanded=true] { border-color: #2864DC; }
    .menu-text { flex: 1; min-width: 0; display: grid; }
    .menu-set, .menu-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    .menu-set { font-size: 12px; color: #53657D; }
    .menu-name { font-weight: 600; }
    .chev { flex: none; width: 10px; height: 10px; border: solid #53657D; border-width: 0 2px 2px 0; transform: translateY(-2px) rotate(45deg); transition: transform .15s; }
    .menu-btn[aria-expanded=true] .chev { transform: translateY(2px) rotate(-135deg); }
    .menu-pop { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 5; display: grid; gap: 6px; padding: 6px;
      background: #FFFFFF; border: 1px solid #CDD7E5; border-radius: 10px; box-shadow: 0 12px 32px rgba(0,0,0,.5); }
    .menu-pop input { width: 100%; background: #FFFFFF; color: inherit; border: 1px solid #CDD7E5; border-radius: 6px; padding: 7px 8px; font: inherit; }
    .menu-list { list-style: none; margin: 0; padding: 0; max-height: 320px; overflow-y: auto; }
    .menu-group { padding: 8px 8px 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #64748B; }
    .menu-opt { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 6px; cursor: pointer; }
    .menu-opt.active { background: #EAF0FF; }
    .menu-opt .menu-name { flex: 1; min-width: 0; font-weight: 500; }
    .menu-opt[aria-selected=true] .menu-name { color: #1659D5; font-weight: 600; }
    .menu-empty { padding: 10px 8px; color: #53657D; }
    .chip { flex: none; font-size: 11px; padding: 2px 7px; border-radius: 999px; background: #DCE4EF; color: #425774; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .chip.done { background: #E4F5EC; color: #13734F; }
    .chip.pts { display: inline-flex; align-items: center; gap: 3px; background: #EAF0FF; color: #1659D5; }
    .chip .pts-icon { width: 11px; height: 11px; }
    .summary .pts-icon, .rules .pts-icon { width: 14px; height: 14px; margin-inline-end: 4px; vertical-align: -2px; }
    .chem-ico { font: normal 400 13px/1 UltimateTeam-Icons, sans-serif; margin-inline-end: 4px; color: #1659D5; }
    .chem-ico::before { content: '\\e030'; }
    /* Number boxes with their own - and + buttons instead of the browser's spinner. */
    .stepper { display: inline-flex; align-items: stretch; border: 1px solid #CDD7E5; border-radius: 6px; background: #FFFFFF; }
    .stepper:focus-within { border-color: #2864DC; }
    .stepper button { border: 0; background: none; padding: 0 10px; color: #53657D; font-size: 16px; line-height: 1; }
    .stepper button:not(:disabled):hover { color: #1659D5; }
    .stepper input { width: 52px; border: 0; background: none; color: inherit; font: inherit; text-align: center; padding: 6px 0; font-variant-numeric: tabular-nums; }
    .stepper input:focus-visible { outline: none; }
    .stepper input.wide { width: 76px; }
    .stepper input::placeholder { color: #64748B; }
    .segmented { display: inline-flex; border: 1px solid #CDD7E5; border-radius: 6px; overflow: hidden; }
    .segmented button { border: 0; border-radius: 0; padding: 6px 12px; background: #FFFFFF; color: #53657D; }
    .segmented button + button { border-left: 1px solid #CDD7E5; }
    /* On the Club tab the language switch is only as wide as its three choices. */
    section > .segmented { justify-self: start; }
    .segmented button[aria-pressed=true] { background: #DCE4EF; color: #172B46; font-weight: 600; }
    /* SBC options: small cards, each a 2-column grid of equal fields and a list of switches. */
    .opt-card { display: grid; gap: 10px; padding: 12px; border: 1px solid #DCE4EF; border-radius: 10px; background: #FFFFFF; }
    .opt-card h3 { margin: 0; font-size: 12px; font-weight: 600; color: #53657D; }
    .pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .field { display: grid; gap: 4px; min-width: 0; }
    .field > span { font-size: 13px; color: #53657D; }
    .field .stepper { display: flex; }
    .field .stepper input, .field .stepper input.wide { flex: 1; width: 0; min-width: 0; }
    .segmented.full { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    /* On/off options: the text on the left, a switch on the right, one row each. */
    .switches { display: grid; }
    .switch-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-top: 1px solid #DCE4EF; cursor: pointer; }
    .switch-row:first-child { border-top: 0; padding-top: 2px; }
    input.switch { appearance: none; -webkit-appearance: none; flex: none; position: relative; width: 34px; height: 20px; margin: 0; border-radius: 999px; background: #CDD7E5; cursor: pointer; transition: background .15s; }
    input.switch::before { content: ''; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: #425774; transition: transform .15s, background .15s; }
    input.switch:checked { background: #1659D5; }
    input.switch:checked::before { transform: translateX(14px); background: #FFFFFF; }
    /* Arabic: right to left. Cards and the pitch keep the game's own left and right; letter spacing
       would break the joined Arabic letters. */
    [dir=rtl] .card, [dir=rtl] .pitch { direction: ltr; }
    [dir=rtl] h2, [dir=rtl] h3, [dir=rtl] .tag, [dir=rtl] .menu-group { letter-spacing: 0; }
    [dir=rtl] .dock-progress i, [dir=rtl] .dock-row.placed .name::after { transform-origin: right; }
    [dir=rtl] .cat, [dir=rtl] .set-head, [dir=rtl] .menu-btn, [dir=rtl] button.pick { text-align: right; }
    [dir=rtl] input.switch::before { left: auto; right: 3px; }
    [dir=rtl] input.switch:checked::before { transform: translateX(-14px); }
    [dir=rtl] .segmented button + button { border-left: 0; border-right: 1px solid #CDD7E5; }

    /* FutFusion workbench: clear paper surfaces and a dedicated football pitch. */
    .panel, .dock { font-family: 'Segoe UI', system-ui, sans-serif; color-scheme: light; }
    header { background: #FFFFFF; padding: 18px 22px; border-bottom-color: #DCE4EF; }
    h1 { font-family: 'Bahnschrift', 'Segoe UI', sans-serif; font-size: 23px; letter-spacing: -.04em; }
    h2 { font-size: 12px; color: #53657D; }
    .body { padding: 22px; gap: 22px; scrollbar-gutter: stable; }
    .tabs { background: #FFFFFF; padding-inline: 14px; }
    .tabs button { min-height: 52px; font-weight: 650; }
    button { transition: background .15s, border-color .15s; min-height: 36px; }
    button:not(:disabled):hover { border-color: #2864DC; }
    button.primary, button.market { color: #FFFFFF; }
    button.primary:disabled { background: #E3E9F2; color: #64748B; }
    input, select { min-height: 38px; }
    .opt-card, .easy-gallery, .trade-entry, .tagc { box-shadow: 0 2px 5px #172B4605; }
    .note { font-size: 12px; line-height: 1.65; }
    .summary { position: sticky; top: -22px; z-index: 2; border: 1px solid #CDD7E5; background: #FFFFFF; padding: 14px; }
    .pitch { background: repeating-linear-gradient(0deg, #174B3D 0px, #174B3D 90px, #1B5344 90px, #1B5344 180px); border: 1px solid #326A58; padding-block: 22px; border-radius: 14px; }
    .pitch .src, .pitch .cap, .pitch .pick-line { color: #ECF7F1; }
    .pitch .card { color: #FFFFFF; }
    .pitch .card.blank { color: #172B46; text-shadow: none; }
    .pitch button { background: #FFFFFF; color: #172B46; }
    .manual-slot-actions { max-width: 140px; gap: 4px; display: block; width: 100%; color: #172B46; }
    .manual-slot-actions summary { cursor: pointer; background: #FFFFFF; padding: 7px; border-radius: 6px; font-size: 11px; text-align: center; }
    .manual-slot-actions button { display: block; width: 100%; margin-top: 4px; }
    .squad-list .pitch-row { display: grid; gap: 8px; }
    .squad-list .pitch-row > .slot { max-width: none; display: grid; grid-template-columns: 55px 1fr 110px; align-items: center; gap: 10px; padding: 8px; }
    .squad-list .card { width: 55px; grid-column: 1; grid-row: 1 / span 3; }
    .squad-list .list-player-name { grid-column: 2; grid-row: 1; justify-self: start; color: #ECF7F1; font-size: 13px; overflow-wrap: anywhere; }
    .squad-list .pick-line { grid-column: 2; grid-row: 2; width: 100%; }
    .squad-list .src { grid-column: 2; grid-row: 3; justify-self: start; }
    .squad-list .manual-slot-actions { grid-column: 3; grid-row: 1 / span 3; }
    .manual-slot-actions button { font-size: 11px; min-height: 30px; padding: 5px 7px; }
    .trade-metrics { background: #FFFFFF; }
    .trade-metrics span { font-size: 10px; }
    .trade-metrics strong { font-family: 'Bahnschrift', 'Segoe UI', sans-serif; font-size: 24px; letter-spacing: -.03em; }
    .trade-progress { background: #EAF0FF; border-color: #2864DC; }
    .gallery-trades .trade-heading h3, .easy-gallery .trade-heading h3 { color: #172B46; }
    .trade-entry { background: #FFFFFF; }
    .workflow-track { list-style: none; display: grid; grid-template-columns: repeat(4, 1fr); padding: 0; margin: 6px 0 12px; gap: 4px; counter-reset: workflow; }
    .workflow-track li { counter-increment: workflow; border-top: 3px solid #CDD7E5; padding-top: 9px; font-size: 10px; color: #53657D; }
    .workflow-track li::before { content: counter(workflow) '. '; font-weight: 700; }
    .workflow-track li.current { border-color: #1659D5; color: #1659D5; font-weight: 650; }
    .trade-batch > details { display: grid; }
    .trade-batch > details > button { width: 100%; margin-top: 7px; }
    .event-log { max-height: 260px; overflow-y: auto; padding-inline-start: 20px; font-size: 11px; color: #53657D; line-height: 1.8; }
    .workspace-intro { display: grid; gap: 5px; padding-bottom: 18px; border-bottom: 1px solid #CDD7E5; }
    .workspace-intro h2 { font: 650 25px/1.2 'Bahnschrift', 'Segoe UI', sans-serif; color: #172B46; text-transform: none; letter-spacing: -.03em; margin: 0; }
    .workspace-intro p { margin: 0; font-size: 12px; color: #53657D; line-height: 1.6; }
    .workspace-status { display: flex; align-items: center; gap: 7px; font-size: 11px; color: #53657D; margin-top: 5px; }
    .workspace-status::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: #13734F; }
    .action-bar { display: grid; gap: 8px; background: #FFFFFF; border-top: 1px solid #CDD7E5; padding: 12px 22px; flex: none; box-shadow: 0 -4px 16px #172B4608; }
    .action-bar button { min-height: 44px; }
    .action-bar .note { margin: 0; max-height: 54px; overflow-y: auto; }
    summary:focus-visible, a:focus-visible { outline: 2px solid #1659D5; outline-offset: 3px; }
    footer { background: #FFFFFF; font-size: 11px; padding: 10px 22px; }
    .error { color: #A7293B; background: #FFF0F2; padding: 12px; border-radius: 8px; overflow-wrap: anywhere; }
    @media (max-width: 420px) { .body { padding: 14px; } .trade-metrics > div { padding: 12px 7px; } .trade-metrics strong { font-size: 20px; } .panel .pair { grid-template-columns: 1fr; } }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
  `;

  root.FutFox.panelStyles = styles;
})(globalThis);
