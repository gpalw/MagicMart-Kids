// js/scenes/MenuScene.js

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // === 1. 全局资源加载 (一次加载，永久使用) ===
        // 加载进度条（可选，为了让孩子知道在加载）
        let loadingText = this.add.text(512, 384, '加载中...', { fontSize: '40px', fill: '#FFF' }).setOrigin(0.5);

        this.load.on('complete', () => loadingText.destroy());

        // 加载食物
        GameAssets.foods.forEach(item => this.load.image(item.key, item.file));
        // 加载动物
        GameAssets.animals.forEach(item => this.load.image(item.key, item.file));

        // 生成粒子贴图
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture('particle', 16, 16);
    }

    create() {
        // 标题
        this.add.text(512, 150, '宝宝游戏乐园', {
            fontFamily: '"ZCOOL KuaiLe"', fontSize: '80px', fill: '#FFF', stroke: '#000', strokeThickness: 8
        }).setOrigin(0.5);

        // 按钮 1：杂货铺
        this.createButton(512, 350, '🍎 神奇杂货铺', 0xFFA500, () => {
            this.scene.start('ShopGame');
        });

        // 按钮 2：影子配对
        this.createButton(512, 500, '👥 影子配对', 0x9370DB, () => {
            this.scene.start('ShadowGame');
        });

        // 播放背景语
        this.time.delayedCall(500, () => this.speak("欢迎回来！你想玩哪个游戏？"));
    }

    createButton(x, y, text, color, onClick) {
        let btn = this.add.text(x, y, text, {
            fontFamily: '"ZCOOL KuaiLe"', fontSize: '48px', fill: '#FFF',
            backgroundColor: color === 0xFFA500 ? '#FFA500' : '#9370DB',
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5).setInteractive();

        // 简单的按下缩小效果
        btn.on('pointerdown', () => {
            this.tweens.add({
                targets: btn, scaleX: 0.9, scaleY: 0.9, duration: 100, yoyo: true,
                onComplete: onClick
            });
            // 解锁音频
            if (this.sound.context.state === 'suspended') this.sound.context.resume();
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