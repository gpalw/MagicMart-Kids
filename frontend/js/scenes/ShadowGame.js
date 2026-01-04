class ShadowGame extends Phaser.Scene {
    constructor() {
        super({ key: 'ShadowGame' });
    }

    init() {
        this.matchCount = 4; // 需要配对成功的数量 (左边只有4个影子)
        this.totalDraggables = 8; // 右边总共有8个物体 (4个对的 + 4个干扰)
        this.matchesMade = 0;
        this.foodZhMap = Object.fromEntries(GameAssets.foods.map((f) => [f.key, f.zh]));
    }

    create() {
        // 1. 初始化烟花
        this.fireworksManager = this.add.particles(0, 0, "particle", {
            speed: { min: 150, max: 500 }, scale: { start: 1, end: 0 }, lifespan: 1000, gravityY: 300,
            tint: [0xff0000, 0xffff00, 0x00ff00], emitting: false
        });

        // 2. 双击返回按钮
        this.createBackButton();

        // 3. 开始回合
        this.startNewRound();
        this.speak("请找出这4个影子的主人！小心有捣乱的哦！");
    }

    startNewRound() {
        if (this.roundGroup) this.roundGroup.clear(true, true);
        this.roundGroup = this.add.group();
        this.shadows = [];
        this.matchesMade = 0;

        // === 1. 挑选素材 ===
        let allFoods = [...GameAssets.foods];
        Phaser.Utils.Array.Shuffle(allFoods); // 打乱整个库

        // 选出 4 个“真命天子” (用来生成影子 + 彩色)
        let targets = allFoods.slice(0, 4);

        // 选出 4 个“捣乱分子” (只生成彩色)
        // 注意：如果素材库不够大，这里可能会报错，你的库有几十个肯定没问题
        let distractors = allFoods.slice(4, 8);

        // === 2. 左边：生成 4 个影子 (竖排) ===
        targets.forEach((data, i) => {
            // 左边位置固定
            let x = 250;
            let y = 180 + i * 140; // 间距拉开一点

            let shadow = this.add.image(x, y, data.key)
                .setScale(1.4)
                .setTint(0x000000)
                .setAlpha(0.6);

            shadow.itemKey = data.key; // 身份证明
            this.shadows.push(shadow);
            this.roundGroup.add(shadow);
        });

        // === 3. 右边：生成 8 个物体 (4真 + 4假) ===
        // 合并列表
        let draggablesList = targets.concat(distractors);
        // 再次打乱，让真假混在一起
        Phaser.Utils.Array.Shuffle(draggablesList);

        // 布局：2列 x 4行
        draggablesList.forEach((data, i) => {
            let col = i % 2;
            let row = Math.floor(i / 2);

            let x = 650 + col * 180;
            let y = 180 + row * 130;

            let item = this.add.image(x, y, data.key)
                .setScale(1.4)
                .setInteractive({ draggable: true });

            item.itemKey = data.key;
            item.originalX = x;
            item.originalY = y;

            // 标记它是不是干扰项 (方便后续处理)
            // 如果 targets 里包含它，它就是真的
            item.isTarget = targets.some(t => t.key === data.key);

            // 点击读音
            item.on('pointerdown', () => {
                let zh = this.foodZhMap[data.key];
                if (zh) this.speak(zh);

                // 干扰项点击时，可以给个特殊的反馈，比如轻微晃动
                if (!item.isTarget) {
                    this.tweens.add({ targets: item, angle: { from: -10, to: 10 }, duration: 50, yoyo: true, repeat: 2 });
                }
            });

            this.input.setDraggable(item);
            this.roundGroup.add(item);
        });

        // --- 拖拽逻辑 ---
        this.input.on('drag', (pointer, obj, dragX, dragY) => {
            obj.x = dragX;
            obj.y = dragY;
            this.children.bringToTop(obj);
        });

        this.input.on('dragend', (pointer, obj, dropped) => {
            let match = null;

            // 只有当这个物体是“目标之一”时，才去检查碰撞
            // 如果是干扰项，直接不用检查了，肯定配不上
            if (obj.isTarget) {
                for (let s of this.shadows) {
                    if (s.visible && s.itemKey === obj.itemKey &&
                        Phaser.Math.Distance.Between(obj.x, obj.y, s.x, s.y) < 100) {
                        match = s;
                        break;
                    }
                }
            }

            if (match) {
                this.handleMatch(obj, match);
            } else {
                // 没配对成功（或者它是干扰项），弹回去
                this.tweens.add({ targets: obj, x: obj.originalX, y: obj.originalY, duration: 300, ease: 'Back.out' });

                // 如果拖到了影子附近但是不对（或者是干扰项拖到了影子上）
                // 可以加一句语音提示
                // 这里简单处理：如果拖拽距离任何一个影子很近但没配对，说明孩子试错了
                let isNearAnyShadow = this.shadows.some(s => Phaser.Math.Distance.Between(obj.x, obj.y, s.x, s.y) < 100);
                if (isNearAnyShadow) {
                    this.speak("不对哦，再仔细看看？");
                }
            }
        });
    }

    handleMatch(item, shadow) {
        item.disableInteractive();

        this.tweens.add({
            targets: item,
            x: shadow.x,
            y: shadow.y,
            duration: 200,
            onComplete: () => {
                this.speak("对了！");
                this.fireworksManager.explode(30, item.x, item.y);

                shadow.visible = false;

                this.tweens.add({ targets: item, scaleX: 1.6, scaleY: 1.6, duration: 200, yoyo: true });

                this.matchesMade++;
                if (this.matchesMade >= this.matchCount) {
                    this.time.delayedCall(800, () => this.gameWin());
                }
            }
        });
    }

    gameWin() {
        this.speak("挑战成功！没有被骗到哦！");
        this.fireworksManager.explode(100, 256, 300);
        this.fireworksManager.explode(100, 768, 300);

        let txt = this.add.text(512, 384, "太 棒 了", {
            fontFamily: '"ZCOOL KuaiLe"', fontSize: "150px", color: "#FFD700", stroke: "#FF4500", strokeThickness: 10
        }).setOrigin(0.5).setScale(0);
        this.roundGroup.add(txt);

        this.tweens.add({
            targets: txt, scaleX: 1, scaleY: 1, angle: 360, duration: 1000, ease: 'Back.out',
            onComplete: () => {
                this.time.delayedCall(4000, () => this.startNewRound());
            }
        });
    }

    createBackButton() {
        let btn = this.add.text(50, 700, '⬅ 返回大厅', {
            fontFamily: '"ZCOOL KuaiLe"', fontSize: '30px', fill: '#FFF', backgroundColor: '#00000080', padding: { x: 10, y: 5 }
        }).setInteractive();

        let lastTime = 0;
        btn.on('pointerdown', () => {
            let now = this.time.now;
            if (now - lastTime < 500) {
                this.scene.start('MenuScene');
            } else {
                lastTime = now;
                this.showToast(btn.x + 80, btn.y, "再点一次退出");
            }
        });
    }

    showToast(x, y, text) {
        let t = this.add.text(x, y, text, { fontSize: '24px', backgroundColor: '#000' }).setOrigin(0.5);
        this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
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