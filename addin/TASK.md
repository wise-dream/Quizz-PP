# Office Web Add-in для PowerPoint Quiz

## Обзор

**Office Web Add-in** — это обычное веб-приложение (HTML/CSS/JS), встраиваемое в Office (в т.ч. PowerPoint) через **манифест**. Оно работает в встроенном браузере (Windows — Edge WebView2, macOS — WKWebView, Web — в вашем браузере) и при необходимости использует `office.js` для доступа к API PowerPoint.

В PowerPoint есть **2 типа аддинов**:

- **Task pane** — панель сбоку (удобно для кнопок ведущего).
- **Content add-in** — веб-блок прямо на слайде (ваша лайв-таблица).

HTTPS обязателен для веб/маркетплейса и вообще «крайне рекомендуется» (иначе предупреждения и блокировки). WebSocket — через `wss://`. Для Windows нужен WebView2 Runtime.

Важный нюанс: **контент и таскпейн не смешиваются в одном манифесте** — делайте **два аддина** (два манифеста) с общими страницами/бандлами: один контент на слайд, другой — панель ведущего.

---

## Как сделать (практика)

### 1) Быстрый генератор

Самый простой старт — `yo office` (PowerPoint Task Pane / PowerPoint Content). Получите два проекта и склейте фронт при желании.

### 2) Ручной минимум: 2 манифеста + 2 страницы

Ниже — **полные файлы** для MVP (подставь свои домены/пути/иконки/GUID'ы).

#### `manifest-content.xml` — контент-аддин (вставка на слайд)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:type="ContentApp">
  <Id>REPLACE-WITH-GUID-CONTENT</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>WiseDream</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="Quiz Content"/>
  <Description DefaultValue="Live scoreboard on slide"/>
  <IconUrl DefaultValue="https://your-domain.example/static/icon-32.png"/>
  <SupportUrl DefaultValue="https://your-domain.example/help"/>
  <Hosts>
    <Host Name="PowerPoint"/>
  </Hosts>
  <DefaultSettings>
    <SourceLocation DefaultValue="https://your-domain.example/content.html"/>
    <RequestedWidth>960</RequestedWidth>
    <RequestedHeight>540</RequestedHeight>
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>
```

#### `manifest-taskpane.xml` — таскпейн (панель ведущего)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<OfficeApp xmlns="http://schemas.microsoft.com/office/appforoffice/1.1"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:type="TaskPaneApp">
  <Id>REPLACE-WITH-GUID-TASKPANE</Id>
  <Version>1.0.0.0</Version>
  <ProviderName>WiseDream</ProviderName>
  <DefaultLocale>en-US</DefaultLocale>
  <DisplayName DefaultValue="Quiz Host Panel"/>
  <Description DefaultValue="Control quiz phases & timers"/>
  <IconUrl DefaultValue="https://your-domain.example/static/icon-32.png"/>
  <SupportUrl DefaultValue="https://your-domain.example/help"/>
  <Hosts>
    <Host Name="PowerPoint"/>
  </Hosts>
  <DefaultSettings>
    <SourceLocation DefaultValue="https://your-domain.example/taskpane.html"/>
  </DefaultSettings>
  <Permissions>ReadWriteDocument</Permissions>
</OfficeApp>
```

#### `content.html` — лайв-таблица на слайде (WebSocket + DOM)

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Quiz Content</title>
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self' https: wss:; connect-src https: wss:;
                 img-src https: data:; style-src 'self' 'unsafe-inline' https:;
                 script-src 'self' https: 'unsafe-inline'; frame-ancestors 'self' https://*.office.com https://*.officeapps.live.com https://*.sharepoint.com;">
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>
  <style>
    html,body {margin:0;padding:12px;font:14px/1.4 system-ui,Segoe UI,Roboto,Arial}
    table {border-collapse:collapse;width:100%}
    th,td {border:1px solid #ddd;padding:6px 8px}
    thead th {position:sticky;top:0;background:#f5f5f5}
    .first {font-weight:600}
    .fs {color:#c00}
  </style>
</head>
<body>
  <div id="status">Connecting…</div>
  <table id="tbl">
    <thead><tr><th>#</th><th>Игрок</th><th>Кнопка</th><th>Δt (мс)</th><th>Фальстарт</th><th>Всего</th></tr></thead>
    <tbody></tbody>
  </table>

<script>
(() => {
  const room = new URLSearchParams(location.search).get('room') || 'R1';
  const wsUrl = `wss://your-domain.example/ws?room=${encodeURIComponent(room)}&role=viewer`;
  let ws, state = { enableAt: 0, players: [] };

  const $status = document.getElementById('status');
  const $tbody  = document.querySelector('#tbl tbody');

  function connect() {
    ws = new WebSocket(wsUrl);
    ws.onopen = () => { $status.textContent = 'Connected'; };
    ws.onclose = () => { $status.textContent = 'Disconnected, retry…'; setTimeout(connect, 1000); };
    ws.onerror = () => { $status.textContent = 'Error (see console)'; };
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.t === 'state') { state = msg; render(); }
      if (msg.t === 'click') { applyClick(msg); render(); }
    };
  }

  function applyClick(ev) {
    const p = state.players.find(x => x.user === ev.user);
    if (!p) return;
    p.lastDeltaMs = ev.deltaMs;
    p.falseStarts = (p.falseStarts|0) + (ev.false_start ? 1 : 0);
    p.clicks = (p.clicks|0) + (ev.false_start ? 0 : 1);
  }

  function render() {
    const rows = [...state.players]
      .sort((a,b) => (a.lastDeltaMs ?? 9e9) - (b.lastDeltaMs ?? 9e9))
      .map((p,i) => `
        <tr class="${i===0 && (p.lastDeltaMs ?? 9e9) < 9e9 ? 'first' : ''}">
          <td>${i+1}</td>
          <td>${p.name || p.user}</td>
          <td>${p.buttonId || ''}</td>
          <td>${p.lastDeltaMs ?? ''}</td>
          <td class="${p.lastDeltaMs==null && p.falseStarts>0 ? 'fs' : ''}">${p.falseStarts|0}</td>
          <td>${p.clicks|0}</td>
        </tr>`);
    $tbody.innerHTML = rows.join('');
  }

  Office.onReady(() => connect());
})();
</script>
</body>
</html>
```

#### `taskpane.html` — панель ведущего (кнопки фаз → WebSocket)

```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Quiz Host</title>
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'self' https: wss:; connect-src https: wss:;
                 img-src https: data:; style-src 'self' 'unsafe-inline' https:;
                 script-src 'self' https: 'unsafe-inline'; frame-ancestors 'self' https://*.office.com https://*.officeapps.live.com https://*.sharepoint.com;">
  <script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js"></script>
  <style>
    body {margin:0;padding:12px;font:14px/1.4 system-ui,Segoe UI,Roboto,Arial}
    button {padding:8px 12px;margin:6px 6px 0 0}
    .row {margin:8px 0}
  </style>
</head>
<body>
  <div class="row">
    Комната: <input id="room" value="R1" size="8">
    <button id="connect">Connect</button>
    <span id="status">—</span>
  </div>
  <div class="row">
    <button data-act="ready"  data-delay="3000">Ready 3s</button>
    <button data-act="start"  >Start now</button>
    <button data-act="finish" >Finish</button>
  </div>

<script>
(() => {
  let ws;
  const $room = document.getElementById('room');
  const $status = document.getElementById('status');

  function openWs() {
    if (ws) try { ws.close(); } catch {}
    const url = `wss://your-domain.example/ws?room=${encodeURIComponent($room.value)}&role=host`;
    ws = new WebSocket(url);
    ws.onopen = () => $status.textContent = 'Connected';
    ws.onclose = () => $status.textContent = 'Closed';
    ws.onerror = () => $status.textContent = 'Error';
  }

  document.getElementById('connect').onclick = openWs;

  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn || !ws || ws.readyState !== 1) return;
    const act = btn.dataset.act;
    if (act === 'ready') {
      ws.send(JSON.stringify({ t:'host_set_state', phase:'ready', delayMs: Number(btn.dataset.delay)||0 }));
    } else if (act === 'start') {
      ws.send(JSON.stringify({ t:'host_set_state', phase:'ready', delayMs: 0 }));
    } else if (act === 'finish') {
      ws.send(JSON.stringify({ t:'host_set_state', phase:'finished' }));
    }
  });

  Office.onReady(() => {});
})();
</script>
</body>
</html>
```

> **Важно**: Всё это надо отдавать по **HTTPS**; WebSocket — **`wss://`**. Для веб-версии это обязательное требование.

### 3) Установка в PowerPoint (sideload)

- **Веб-версия**: Home → Add-ins → More Settings → **Upload My Add-in** → выбираешь `manifest-content.xml` и `manifest-taskpane.xml`.
- **Десктоп**: Insert → My Add-ins → Upload My Add-in (или Shared Folder Catalog).

### 4) Продакшн-деплой

Через **Centralized Deployment** в Microsoft 365 Admin Center — админ заливает манифест(ы), назначает группам.

---

## Что это даёт для твоего проекта

- Контент-аддин на слайде рендерит live-таблицу по `wss://` — как обычный SPA.
- Таскпейн — отдельный UI ведущего (ready/start/finish).
- Оба аддина могут использовать один и тот же backend и общий фронтенд-бандл.

Если нужно — пришлю минимальный `main.go` (WS-сервер по твоему протоколу) и пример `vite.config` c dev-сертом под HTTPS.