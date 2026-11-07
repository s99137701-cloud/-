/**
 * 사방신 무림전 - NetworkManager (PeerJS / WebRTC 기반 1v1 P2P 대전 모듈)
 * 
 * - 별도의 백엔드 서버 없이 무료 PeerJS 클라우드 시그널링 & STUN 서버 활용
 * - 6자리 랜덤 룸 코드 기반 Host-Guest P2P 연결
 * - 위치, 상태, 판정, HP/SP 초저지연 양방향 실시간 동기화
 */
window.SF = window.SF || {};

class NetworkManager {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.roomCode = null;
    this.isConnected = false;

    // STUN 서버 설정 (Netlify 배포 환경에서 NAT/방화벽 통과 지원)
    this.peerConfig = {
      debug: 1,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' }
        ]
      }
    };

    // 콜백 이벤트 핸들러
    this.onRoomCreated = null;     // (code) => {}
    this.onConnected = null;       // () => {}
    this.onData = null;            // (packet) => {}
    this.onDisconnected = null;    // (reason) => {}
    this.onError = null;           // (errorMessage) => {}
  }

  // 1. 6자리 영문/숫자 랜덤 룸 코드 생성 (가독성을 위해 헷갈리는 문자 제외)
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // 2. 방 만들기 (Host): Peer ID를 `murim-room-<CODE>` 형태로 등록
  createRoom(callback) {
    this.cleanup();
    this.isHost = true;
    this.roomCode = this.generateRoomCode();
    const peerId = `murim-room-${this.roomCode}`;

    if (typeof Peer === 'undefined') {
      const err = 'PeerJS 라이브러리를 로드하지 못했습니다. 인터넷 연결을 확인해 주세요.';
      console.error(err);
      if (this.onError) this.onError(err);
      return;
    }

    try {
      this.peer = new Peer(peerId, this.peerConfig);

      this.peer.on('open', (id) => {
        console.log(`[Host] 룸 생성 완료. Peer ID: ${id}, 룸 코드: ${this.roomCode}`);
        if (callback) callback(this.roomCode);
        if (this.onRoomCreated) this.onRoomCreated(this.roomCode);
      });

      // Guest 접속 대기
      this.peer.on('connection', (connection) => {
        console.log('[Host] 게스트 플레이어가 방에 접속했습니다.');
        this.conn = connection;
        this.setupConnection();
      });

      this.peer.on('error', (err) => {
        console.error('[Host Error]', err);
        if (err.type === 'unavailable-id') {
          // 중복 코드 발생 시 자동 재시도
          this.createRoom(callback);
        } else if (this.onError) {
          this.onError(`방 생성 오류: ${err.type || err.message}`);
        }
      });
    } catch (e) {
      console.error(e);
      if (this.onError) this.onError('P2P 시그널링 서버 연결 실패');
    }
  }

  // 3. 방 참가하기 (Guest): 입력받은 6자리 코드로 Host에 접속
  joinRoom(code, callback) {
    this.cleanup();
    this.isHost = false;
    this.roomCode = code.trim().toUpperCase();
    const hostPeerId = `murim-room-${this.roomCode}`;

    if (typeof Peer === 'undefined') {
      const err = 'PeerJS 라이브러리를 로드하지 못했습니다.';
      console.error(err);
      if (this.onError) this.onError(err);
      return;
    }

    try {
      // Guest는 임의의 Peer ID로 생성
      this.peer = new Peer(this.peerConfig);

      this.peer.on('open', (id) => {
        console.log(`[Guest] Peer 준비 완료 (${id}). Host (${hostPeerId}) 접속 시도 중...`);
        this.conn = this.peer.connect(hostPeerId, {
          reliable: true
        });

        this.conn.on('open', () => {
          console.log('[Guest] Host와 P2P 연결 성공!');
          this.setupConnection();
          if (callback) callback();
        });

        this.conn.on('error', (err) => {
          console.error('[Guest Conn Error]', err);
          if (this.onError) this.onError('룸 연결 실패: 코드가 올바르지 않거나 방이 닫혔습니다.');
        });
      });

      this.peer.on('error', (err) => {
        console.error('[Guest Error]', err);
        if (this.onError) this.onError('방 접속 오류: 존재하지 않는 방 코드이거나 호스트가 오프라인입니다.');
      });
    } catch (e) {
      console.error(e);
      if (this.onError) this.onError('P2P 연결 시도 중 오류 발생');
    }
  }

  // 4. DataConnection 이벤트 리스너 설정
  setupConnection() {
    this.isConnected = true;

    this.conn.on('data', (packet) => {
      if (this.onData) {
        this.onData(packet);
      }
    });

    this.conn.on('close', () => {
      console.log('P2P 연결이 종료되었습니다.');
      this.isConnected = false;
      if (this.onDisconnected) {
        this.onDisconnected('상대 플레이어와의 연결이 끊어졌습니다.');
      }
    });

    if (this.onConnected) {
      this.onConnected();
    }
  }

  // 5. 실시간 패킷 전송 (DataConnection.send)
  send(packet) {
    if (this.conn && this.isConnected) {
      try {
        this.conn.send(packet);
      } catch (err) {
        console.error('P2P 송신 오류:', err);
      }
    }
  }

  // 6. 연결 정리
  cleanup() {
    if (this.conn) {
      try { this.conn.close(); } catch(e) {}
      this.conn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch(e) {}
      this.peer = null;
    }
    this.isConnected = false;
    this.roomCode = null;
  }
}

SF.Network = new NetworkManager();
