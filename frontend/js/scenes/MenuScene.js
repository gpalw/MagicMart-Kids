// js/scenes/MenuScene.js

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // 这里加载大厅需要的图片（按钮等）
        // 如果没有素材，我们就暂时用文字代替
    }

    create() {
        // 1. 标题
        this.add.text(512, 150, '宝宝的游戏乐园', {
            fontFamily: '"ZCOOL KuaiLe", Arial',
            fontSize: '80px',
            fill: '#FFF',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // 2. 创建一个“杂货铺”的入口按钮
        this.createGameButton(512, 350, '神奇杂货铺', 0xFFA500, () => {
            this.scene.start('ShopGame'); // 切换到杂货铺场景
        });

        // 3. (未来) 创建“影子配对”的入口
        this.createGameButton(512, 500, '影子配对 (敬请期待)', 0x808080, () => {
            // this.scene.start('ShadowGame'); 
        });

        // 播放背景音乐或欢迎语
        this.speak('欢迎来到游戏乐园，你想玩哪个游戏呀？');
    }

    createGameButton(x, y, text, color, onClick) {
        let container = this.add.container(x, y);

        // 按钮背景 (圆角矩形)
        let bg = this.add.rectangle(0, 0, 400, 100, color).setInteractive();

        // 按钮文字
        let label = this.add.text(0, 0, text, {
            fontFamily: '"ZCOOL KuaiLe", Arial',
            fontSize: '40px',
            fill: '#FFF'
        }).setOrigin(0.5);

        container.add([bg, label]);

        // 点击事件
        bg.on('pointerdown', () => {
            // 点击特效
            this.tweens.add({
                targets: container,
                scaleX: 0.9, scaleY: 0.9,
                duration: 100,
                yoyo: true,
                onComplete: onClick
            });
        });

        // 简单的呼吸动效
        this.tweens.add({
            targets: container,
            scaleX: 1.05, scaleY: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            let u = new SpeechSynthesisUtterance(text);
            u.lang = 'zh-CN';
            window.speechSynthesis.speak(u);
        }
    }
}