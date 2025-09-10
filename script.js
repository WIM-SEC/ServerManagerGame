document.addEventListener('DOMContentLoaded', () => {
    const portListEl = document.getElementById('port-list');
    const browserTabEl = document.getElementById('browser-tab');
    const browserAddressBarEl = document.getElementById('browser-address-bar');
    const browserContentEl = document.getElementById('browser-content');
    const statusMessageEl = document.getElementById('status-message');
    const favoritesBarEl = document.getElementById('favorites-bar');
    const errorModalEl = document.getElementById('error-modal');
    const errorModalTitleEl = document.getElementById('error-modal-title');
    const errorModalMessageEl = document.getElementById('error-modal-message');
    const errorModalCloseBtn = document.getElementById('error-modal-close');
    const resetButton = document.getElementById('reset-button');

    let initialGameState;

    function getInitialGameState() {
        return {
            ports: {
                '21': { name: 'FTP', isOpen: false, trap: true, vulnerability: 'vsftpd 2.3.4' },
                '25': { name: 'SMTP (非SSL)', isOpen: false, isLegacyTrap: true },
                '143': { name: 'IMAP (非SSL)', isOpen: false, isLegacyTrap: true },
                '443': { name: 'HTTPS', isOpen: true },
                '465': { name: 'SMTPS', isOpen: false },
                '993': { name: 'IMAPS', isOpen: false },
            },
            inbox: [],
            currentURL: 'https://abc-shopping.com',
            purchaseMessage: '',
        };
    }
    
    let gameState = getInitialGameState();
    
    // ページ定義
    const pages = {
        'https://abc-shopping.com': {
            title: 'ABCショッピング', port: '443',
            content: (isFtpTrapActive) => {
                if (isFtpTrapActive) return hackedPageContent();
                return `<h3>ABCショッピングへようこそ！</h3>
                        <div class="product"><h4>高機能Webカメラ</h4><p>最新モデルのWebカメラです。</p><button id="buy-button">今すぐ購入</button></div>
                        <p style="color: green;">${gameState.purchaseMessage}</p>`;
            }
        },
        'https://xyz-mail.com/inbox/': {
            title: 'メールボックス | XYZメール', port: null,
            content: () => {
                let inboxHtml = gameState.inbox.map((mail, index) => `<div class="mail-item" data-mail-id="${index}"><span class="from">${mail.from}</span> <span class="subject">${mail.subject}</span></div>`).join('');
                return `<div class="mail-client"><h3>受信トレイ</h3><button id="compose-mail-button">サポートに問い合わせる</button><div class="mail-inbox">${inboxHtml || '<p>受信メールはありません。</p>'}</div><div id="mail-content-view" class="mail-content"></div></div>`;
            }
        },
        'https://xyz-mail.com/compose/': {
            title: 'メール作成 | XYZメール', port: null,
            content: () => `
                <div class="mail-compose">
                    <h3>問い合わせメール作成</h3>
                    <div class="mail-compose-field"><span>From:</span> taro@xyz-mail.com</div>
                    <div class="mail-compose-field"><span>To:</span> support@abc-shopping.com</div>
                    <div class="mail-compose-field"><span>件名:</span> カメラが壊れていました</div>
                    <div class="mail-compose-field"><span>本文:</span><pre>購入したカメラが正常に動作しません。\n確認をお願いします。</pre></div>
                    <button id="send-mail-button">送信</button>
                </div>`
        }
    };

    function hackedPageContent() {
        return `<div class="hacked-site"><h3>Hacked by Anonymous</h3><p>> Your security is a joke!</p><p>> FTP port 21 (vsftpd 2.3.4) should not be open!</p></div>`;
    }

    // --- 表示更新 ---
    function renderPorts() {
        portListEl.innerHTML = '';
        for (const portNum in gameState.ports) {
            const port = gameState.ports[portNum];
            const portItem = document.createElement('div');
            portItem.className = 'port-item';
            let buttonHtml = port.isOpen ? `<button class="close-btn" data-port="${portNum}">閉鎖</button>` : `<button class="open-btn" data-port="${portNum}">解放</button>`;
            let vulnerabilityHtml = port.trap ? `<span class="port-vulnerability">(${port.vulnerability})</span>` : (port.isLegacyTrap ? `<span class="port-vulnerability">(非SSL:危険)</span>` : '');
            portItem.innerHTML = `<div class="port-info"><span class="port-number">${portNum}</span><span class="port-service">${port.name}</span>${vulnerabilityHtml}</div><div class="port-actions">${buttonHtml}</div>`;
            portListEl.appendChild(portItem);
        }
    }

    function renderBrowser() {
        const currentPage = pages[gameState.currentURL];
        if (!currentPage) return;
        
        const isFtpTrapActive = gameState.ports['21'].isOpen;
        browserTabEl.textContent = currentPage.title;
        browserAddressBarEl.textContent = gameState.currentURL;
        const canAccess = currentPage.port ? gameState.ports[currentPage.port].isOpen : true;

        if (canAccess) {
            browserContentEl.innerHTML = currentPage.content(isFtpTrapActive);
        } else {
            browserContentEl.innerHTML = `<div class="error-page"><h3>このサイトにアクセスできません</h3><p>${gameState.currentURL.split('/')[0]} が見つかりませんでした。</p></div>`;
            gameState.purchaseMessage = '';
        }
    }

    // --- メッセージ＆ダイアログ制御 ---
    function updateStatusMessage(message, type = 'info') {
        statusMessageEl.textContent = message;
        statusMessageEl.className = 'status-message-area';
        statusMessageEl.classList.add(`status-${type}`);
    }

    function showDialog(message, title = "エラー", type = 'error') {
        errorModalTitleEl.textContent = title;
        errorModalMessageEl.innerHTML = message;
        errorModalEl.style.display = 'flex';
        updateStatusMessage(message.replace(/<br>/g, ' '), type);
    }
    errorModalCloseBtn.addEventListener('click', () => { errorModalEl.style.display = 'none'; });

    function analyzeAndSetStatus() {
        const currentPage = pages[gameState.currentURL];
        if (!currentPage) return;
        
        if (gameState.ports['21'].isOpen && (currentPage.port === '443')) {
            updateStatusMessage('警告: FTP(21)ポートの脆弱性によりサイトが改ざんされました！', 'error');
            return;
        }
        if (currentPage.port && !gameState.ports[currentPage.port].isOpen) {
            updateStatusMessage(`Webサイトにアクセスできません。HTTPS(443)ポートが閉鎖されています。`, 'info');
            return;
        }
        updateStatusMessage('各サービスが正常に動作するようポートを解放・閉鎖してください。', 'info');
    }
    
    // --- ゲーム全体の更新 ---
    function updateGame() {
        renderPorts();
        renderBrowser();
        analyzeAndSetStatus();
        attachEventListeners();
    }
    
    function resetGame() {
        gameState = getInitialGameState();
        updateGame();
    }


    // --- イベントリスナー ---
    function attachEventListeners() {
        document.querySelectorAll('.port-actions button').forEach(button => {
            button.addEventListener('click', (e) => {
                const portNum = e.target.dataset.port;
                gameState.ports[portNum].isOpen = !gameState.ports[portNum].isOpen;
                updateGame();
            });
        });

        const buyButton = document.getElementById('buy-button');
        if (buyButton) {
            buyButton.addEventListener('click', () => {
                gameState.purchaseMessage = 'ご購入ありがとうございます。確認メールを送信しました。';
                if (gameState.ports['25'].isOpen) {
                    showDialog(`<strong>顧客情報流出！</strong><br>安全でない通信ポート(非SSL)を経由したため、購入情報が第三者に盗まれました。`, 'セキュリティインシデント', 'error');
                } else if (gameState.ports['465'].isOpen) {
                    updateStatusMessage('確認メールを正常に送信しました。', 'success');
                    gameState.inbox.push({ from: 'thankyou@abc-shopping.com', to:'taro@xyz-mail.com', subject: 'ご購入ありがとうございます', body: 'ABCショッピングをご利用いただき、誠にありがとうございます。\n\n商品：高機能Webカメラ\n金額：12,000円' });
                } else {
                    showDialog('メール送信エラー<br>SMTPS(465)ポートが閉鎖中のため、確認メールを送信できませんでした。', 'エラー', 'error');
                }
                updateGame();
            });
        }
        
        const composeMailButton = document.getElementById('compose-mail-button');
        if(composeMailButton) {
            composeMailButton.addEventListener('click', () => {
                gameState.currentURL = 'https://xyz-mail.com/compose/';
                updateGame();
            });
        }

        const sendMailButton = document.getElementById('send-mail-button');
        if (sendMailButton) {
            sendMailButton.addEventListener('click', () => {
                if (gameState.ports['25'].isOpen) {
                    showDialog(`<strong>通信内容の漏洩！</strong><br>安全でない通信ポート(非SSL)を経由したため、問い合わせ内容が第三者に盗まれました。`, 'セキュリティインシデント', 'error');
                    return;
                }
                if (!gameState.ports['465'].isOpen) {
                     gameState.inbox.push({ from: 'MAILER-DAEMON@xyz-mail.com', to:'taro@xyz-mail.com', subject: 'Undelivered Mail Returned to Sender', body: 'メッセージを送信できませんでした。\nサーバーに接続できませんでした。'});
                     showDialog('メール送信エラー<br>SMTPS(465)ポートが解放されていません。<br>送信者にエラーメールが返却されました。', 'エラー', 'error');
                } else {
                    const canReceive = gameState.ports['993'].isOpen;
                    if (!canReceive) {
                        updateStatusMessage('注意: メールは送信されましたが、返信を受信するためのIMAPS(993)ポートが閉鎖中です。', 'info');
                    } else {
                        updateStatusMessage('サポートへ問い合わせメールを送信しました。', 'success');
                        setTimeout(() => {
                            gameState.inbox.push({ from: 'support@abc-shopping.com', to:'taro@xyz-mail.com', subject: 'Re: カメラが壊れていました', body: 'お問い合わせありがとうございます。\n担当者より折り返しご連絡いたします。'});
                            if(gameState.currentURL.includes('mail')) updateGame();
                        }, 2000);
                    }
                }
                gameState.currentURL = 'https://xyz-mail.com/inbox/';
                updateGame();
            });
        }


        document.querySelectorAll('.mail-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const mailId = e.currentTarget.dataset.mailId;
                const mail = gameState.inbox[mailId];
                const mailContentView = document.getElementById('mail-content-view');
                if (mailContentView) {
                    mailContentView.innerHTML = `
                        <div class="mail-header">
                            <div><span>From:</span> ${mail.from}</div>
                            <div><span>To:</span> ${mail.to}</div>
                            <div><span>Subject:</span> ${mail.subject}</div>
                        </div>
                        <div class="mail-body">${mail.body}</div>
                    `;
                    mailContentView.style.display = 'block';
                }
            });
        });
    }

    function initializeFavorites() {
        favoritesBarEl.innerHTML = `<a href="#" class="favorite" data-url="https://abc-shopping.com">ABCショッピング</a><a href="#" class="favorite" data-url="https://xyz-mail.com/inbox/">XYZメール</a>`;
        document.querySelectorAll('.favorite').forEach(fav => {
            fav.addEventListener('click', (e) => {
                e.preventDefault();
                gameState.currentURL = e.target.dataset.url;
                gameState.purchaseMessage = '';
                updateGame();
            });
        });
    }

    // --- 初期化 ---
    resetButton.addEventListener('click', resetGame);
    initializeFavorites();
    updateGame();
});