# freeformserver

`freeform/live.js`의 Yjs 의존성을 대체할 수 있도록 만든 TypeScript 기반 mirroring backend입니다.  
현재 구현은 `room snapshot + WebSocket fan-out + in-memory room store` 조합이며, 저장 계층은 나중에 SQLite/Redis로 교체하기 쉽게 분리했습니다.

## 포함된 기능

- `GET /api/rooms/:roomId`
- `GET /api/rooms/:roomId/snapshot`
- `POST /api/rooms/:roomId/seed`
- `GET /api/rooms/:roomId/presence`
- `WS /ws?room=:roomId&clientId=:clientId`
- room별 broadcast isolation
- seed room 자동 생성
- element upsert / patch / delete
- settings patch
- ordered history append
- presence update / disconnect cleanup

## 시작

```bash
npm install
npm run dev
```

기본 포트는 `8787`입니다.

## HTTP API

### `GET /api/rooms/:roomId`

최신 room snapshot을 반환합니다.

### `POST /api/rooms/:roomId/seed`

room이 없으면 seed 데이터로 초기화하고, 이미 있으면 현재 snapshot을 그대로 반환합니다.

### `GET /api/rooms/:roomId/presence`

현재 접속자 목록을 반환합니다.

## WebSocket

연결:

```txt
ws://localhost:8787/ws?room=demo-room&clientId=browser-a
```

서버는 연결 직후 아래 두 메시지를 내려줍니다.

```json
{ "type": "room.snapshot", "payload": { "...": "..." } }
{ "type": "presence.list", "payload": [] }
```

## `live.js` 연동 방향

1. 최초 진입 시 `GET /api/rooms/:roomId`로 snapshot 로드
2. `new WebSocket(...)`으로 `/ws` 연결
3. 서버 메시지를 받아 로컬 state store를 갱신
4. `putItem`, `updateFields`, `pushHistory`, `settings` 변경 시 WebSocket 메시지 전송
5. 커서 이동은 `presence.update`로만 전송하고, 저장 데이터와 분리 유지

## 현재 제한

- 데이터 저장소는 메모리 기반입니다. 서버 재시작 시 room 상태가 사라집니다.
- drag patch coalescing은 아직 클라이언트 또는 reverse proxy 수준에서 추가하는 것이 좋습니다.
- `element.patch`는 현재 `id`, `seed`, `kind` 변경을 허용하지 않습니다.
