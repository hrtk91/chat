'use strict';

document.addEventListener('DOMContentLoaded', () => {

const textarea = $('#input_text');
const sendButton = $('#send_button');
const uploadButton = $('#upload_button');
const logoutButton = $('#logout_button');

// ページ読み込み処理
$('<div/>').appendTo('body').load('login.html', function () {
    const login_module = new LoginModule();
    const dialog = login_module.dom.dialog;
    const username = $(login_module.dom.input.username).val();
    const password = $(login_module.dom.input.password).val();
    if (username && password) {
        login_module.login();
    } else {
        dialog.showModal();
    }
});
fetchArticles().catch(err => alert('通信に失敗しました。\r\nページをリロードしてください。'));
// ここまで

sendButton.on('click', (e) => {
    const sender = Cookies.get('username');
    const message = textarea.val();
    fetch('/article', {
        headers: { 'content-type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ sender: sender, message: message })
    })
    .then(res => {
        if (!res.ok) throw new Error('メッセージの送信に失敗しました。');
        fetchArticles();
    });
});

uploadButton.on('change', evt => {
    const fileData = evt.target.files[0];
    
  if (!fileData.type.match('image/png') && !fileData.type.match('image/jpeg')) {
        alert('pngまたはjpeg画像を選択してください');
        return;
    }

    const reader = new FileReader();
    new Promise(resolve => {
        reader.onload = resolve;
        reader.readAsDataURL(fileData);
    })
    .then(evt => reader.result)
    .then(body => {
        const tmpImg = new Image();
        return new Promise((resolve, reject) => {
            tmpImg.onload = resolve;
            tmpImg.onerror = reject;
            tmpImg.crossOrigin = 'Anonymous';
            tmpImg.src = body;
        });
    })
    .catch(() => new Error('画像読み込み失敗'))
    .then(evt => {
        const tmpImg = evt.target;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        function Reduction (x, y, pix, scale) { if (x * y * scale > pix && scale > 0) return Reduction(x, y, pix, scale * 0.9); else return scale; }
        let scale = Reduction(tmpImg.width, tmpImg.height, 800*800, 1);
        scale = scale > 0.001 ? scale : 0;
        const dstWidth = tmpImg.width * scale;
        const dstHeight = tmpImg.height * scale;

        img.width = canvas.width = dstWidth;
        img.height = canvas.height = dstHeight;
        ctx.drawImage(tmpImg, 0, 0, tmpImg.width, tmpImg.height, 0, 0, dstWidth, dstHeight);

        const dataURL = canvas.toDataURL();
        return new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.dataURL =dataURL;
            img.src = dataURL;
        });
    })
    .catch(() => new Error('画像変換に失敗しました。'))
    .then(evt => {
        const img = evt.target;
        const dataURL = img.dataURL;

        return fetch('./image', {
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
            body: JSON.stringify({
                sender: 'user',
                message: '',
                imageData: dataURL.substring(dataURL.indexOf(',') + 1)
            })
        });
    })
    .catch(() => new Error('画像の送信に失敗しました。'))
    .then(res => {
        if (!res.ok) {
            throw new Error('送信失敗');
        }
        fetchArticles();
    });
});

logoutButton.on('click', function (evt) {
    const isLogout = confirm('ログアウトします。\r\nよろしいですか？');
    if (isLogout) {
        Cookies.remove('username');
        Cookies.remove('password');
        window.location.reload();
    }
});

function fetchArticles(url) {
    url = url || './articles';
    return fetch(url, { method: 'GET' })
    .then(res => {
        if (!res.ok)
            throw new Error('Articlesの取得に失敗。');
        
        return res.json();
    })
    .then(json => {
        const articles = json.map(x => {
            x.created = new Date(x.created);
            x.updated = new Date(x.updated);
            return x;
        })
        .sort((a,b) => b.updated - a.updated);

        return articles;
    })
    .then(restructArticles);
}

function Article(article) {
    const sender = article.sender || '';
    const message = article.message || '';
    const date = article.updated;
    const create =
        date.getFullYear().toString()
        + '年'
        + ('00' + (date.getMonth() + 1).toString()).slice(-2)
        + '月'
        + ('00' + date.getDate().toString()).slice(-2)
        + '日 '
        + ('00' + date.getHours().toString()).slice(-2)
        + ':'
        + ('00' + date.getMinutes().toString()).slice(-2)
        + ':'
        + ('00' + date.getSeconds().toString()).slice(-2);

    const image = new Image();
    image.crossOrigin ='anonymous';
    if (article.image) { 
        image.src = 'data:image/jpg;base64,' + article.image;
    }

    const header =
        $('<div class="article_header"></div>')
        .append(
            $(`<h3>${sender}</h3>`)
            .append(`<span class="post_time">posted at:${create}</span>`)
        );
    const body =
        $('<div class="article_body"></div>')
        .append(`<p>${message}</p>`)
        .append(image);
    const footer =
        $('<div class="article_footer"></div>');

    return $('<div class="article"></div>')
        .append(header)
        .append(body)
        .append(footer);
}

function restructArticles(articles) {
    $('#articles').empty();
    articles.forEach(article => Article(article).appendTo('#articles'));
}

/*
const recordStartButton = $('#record_start_button');
const recordStopButton = $('#record_stop_button');
const range = $('#range');

if (/iP(hone|(o|a)d)/.test(navigator.userAgent)) {
    recordStartButton.remove();
    recordStopButton.remove();
    range.remove();
} else {

let audioContext = new AudioContext();
let canvas = null;

recordStartButton.on('click', function (evt) {
    const bufferSize = 1024;
    let buffer = [];
    audioContext = new AudioContext();
    navigator.mediaDevices.getUserMedia({audio: true})
    .then(stream => {
        const mss = audioContext.createMediaStreamSource(stream);
        const sp = audioContext.createScriptProcessor(bufferSize, 1, 1);
        
        canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const resolution = 1024;
        const base = resolution * 0.5;
        canvas.width = canvas.height = resolution;

        $('#button_area').append(canvas);
        $(canvas).css('width', base + 'px');
        $(canvas).css('height', base + 'px');
    
        sp.onaudioprocess = function (evt) {
            const input = event.inputBuffer.getChannelData(0);
            let bufferData = new Float32Array(bufferSize);

            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.moveTo(0, base);
            input.forEach((v, i) => {
                bufferData[i] = v;
                ctx.lineTo(i, base + v * base);
                range.val(v);
            });
            ctx.stroke();
        }

        mss.connect(sp);
        sp.connect(audioContext.destination);
    });
});

recordStopButton.on('click', function (evt) {
    audioContext && audioContext.close();
    canvas && canvas.remove();
});
}
*/

});

