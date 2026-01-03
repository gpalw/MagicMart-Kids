// js/scenes/ShopGame.js

class ShopGame extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopGame' }); // 场景的唯一 Key
    }

    // ================= 初始化变量 =================
    init() {
        this.TOTAL_ITEMS = 15;
        this.currentTargetKey = "";
        this.currentTargetCount = 0;
        this.currentFound = 0;
        this.gameStarted = false;
        this.fireworksManager = null;
        this.roundGroup = null;
        this.currentDropZone = null;
        this.instructionTimer = null;
        this.foodZhMap = null;
    }

    // ================= 资源预加载 =================
    preload() {
        // 动态加载 foods
        GameAssets.foods.forEach((item) => {
            this.load.image(item.key, item.file);
        });
        // 动态加载 animals
        GameAssets.animals.forEach((animal) => {
            this.load.image(animal.key, animal.file);
        });
        // 粒子贴图
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture("particle", 16, 16);
    }

    // ================= 场景创建 =================
    create() {
        // 建立映射
        if (!this.foodZhMap) {
            this.foodZhMap = Object.fromEntries(GameAssets.foods.map((f) => [f.key, f.zh]));
        }

        // 初始化烟花
        this.createFireworks();

        // 绑定全局拖拽事件
        this.bindGlobalInputEvents();

        // 创建开始按钮
        this.createStartButton();

        // === 新增：返回大厅按钮 ===
        this.createBackButton();
    }

    // ================= 辅助逻辑封装 =================

    createBackButton() {
        // 按钮本身
        let btn = this.add.text(50, 720, '⬅ 返回大厅', {
            fontFamily: '"ZCOOL KuaiLe"',
            fontSize: '30px',
            fill: '#FFF',
            backgroundColor: '#00000080', // 加个半透明背景，更像按钮
            padding: { x: 10, y: 5 }
        })
            .setInteractive()
            .setDepth(9999); // 保证最上层

        // 用于记录点击时间
        let lastClickTime = 0;

        btn.on('pointerdown', () => {
            const currentTime = this.time.now;

            // 判断两次点击间隔是否小于 500ms
            if (currentTime - lastClickTime < 500) {
                // === 双击成功 ===
                this.cleanupRound();
                this.scene.start('MenuScene');
            } else {
                // === 第一次点击 ===
                lastClickTime = currentTime;

                // 给个提示，告诉孩子要再点一次
                this.showToast(btn.x + btn.width / 2, btn.y - 30, "再点一次退出");

                // 按钮稍微变色一下作为反馈
                btn.setTint(0xAAAAAA);
                this.time.delayedCall(100, () => btn.clearTint());
            }
        });
    }

    createFireworks() {
        this.fireworksManager = this.add.particles(0, 0, "particle", {
            speed: { min: 150, max: 500 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 1000,
            gravityY: 300,
            tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff],
            emitting: false,
        });
        this.fireworksManager.setDepth(10000);
    }

    bindGlobalInputEvents() {
        this.input.on("dragstart", (pointer, gameObject) => {
            gameObject.setDepth(1000);
        });
        this.input.on("drag", (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });
        this.input.on("dragend", (pointer, gameObject, dropped) => {
            if (!dropped) {
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
            gameObject.setDepth(0);
        });

        this.input.on("drop", (pointer, gameObject, target) => {
            if (!this.gameStarted) return;
            if (!this.currentDropZone || target !== this.currentDropZone) return;

            const key = gameObject.getData("key");

            if (key === this.currentTargetKey) {
                gameObject.destroy();
                this.currentFound++;

                const countText = String(this.currentFound);
                this.speak(countText);
                this.showBigNumberEffect(countText);

                if (this.currentFound >= this.currentTargetCount) {
                    this.time.delayedCall(800, () => this.gameWin());
                }
            } else {
                const wrongZh = this.foodZhMap?.[key];
                const targetZh = this.foodZhMap?.[this.currentTargetKey] || "";
                if (wrongZh && targetZh) {
                    this.speak(`这是${wrongZh}，不是${targetZh}哦`);
                }
                gameObject.x = gameObject.input.dragStartX;
                gameObject.y = gameObject.input.dragStartY;
            }
        });
    }

    createStartButton() {
        let btn = this.add.text(512, 384, "点击开始游戏", {
            fontFamily: '"ZCOOL KuaiLe"', fontSize: "64px", fill: "#fff", backgroundColor: "#000", padding: { x: 30, y: 15 },
        }).setOrigin(0.5).setInteractive();

        btn.on("pointerdown", () => {
            // 全屏请求逻辑保留
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => { });
            }
            // 音频解锁
            if (this.sound?.context?.state === "suspended") this.sound.context.resume();
            this.speak("游戏开始！");

            btn.destroy();
            this.gameStarted = true;
            this.initRound();
        });
    }

    initRound() {
        this.cleanupRound();
        this.roundGroup = this.add.group();

        // NPC
        const npcData = Phaser.Utils.Array.GetRandom(GameAssets.animals);
        const npc = this.add.image(850, 600, npcData.key).setScale(1.5);
        this.roundGroup.add(npc);

        // Zone
        this.currentDropZone = this.add.zone(850, 600, 250, 250).setRectangleDropZone(250, 250);
        this.roundGroup.add(this.currentDropZone);

        // Task
        const targetFood = Phaser.Utils.Array.GetRandom(GameAssets.foods);
        this.currentTargetKey = targetFood.key;
        this.currentTargetCount = Phaser.Math.Between(1, 5);
        this.currentFound = 0;

        // Spawn List
        let itemsToSpawn = [];
        for (let i = 0; i < this.currentTargetCount; i++) itemsToSpawn.push(targetFood.key);
        for (let i = 0; i < this.TOTAL_ITEMS - this.currentTargetCount; i++) {
            itemsToSpawn.push(Phaser.Utils.Array.GetRandom(GameAssets.foods).key);
        }
        Phaser.Utils.Array.Shuffle(itemsToSpawn);

        this.spawnItems(itemsToSpawn, targetFood, npcData);
    }

    cleanupRound() {
        if (this.roundGroup) {
            this.roundGroup.clear(true, true);
            this.roundGroup = null;
        }
        this.currentDropZone = null;
        if (this.instructionTimer) {
            this.instructionTimer.remove(false);
            this.instructionTimer = null;
        }
    }

    spawnItems(itemList, targetFoodData, npcData) {
        const padding = 80;
        const spawnRect = { x: padding, y: 100, w: 1024 - padding * 2, h: 500 };
        const MIN_DISTANCE = 130;
        let existingPoints = [{ x: 850, y: 600, radius: 250 }];

        itemList.forEach((key) => {
            let x, y, safe = false, attempts = 0;
            while (!safe && attempts < 50) {
                attempts++;
                x = Phaser.Math.Between(spawnRect.x, spawnRect.x + spawnRect.w);
                y = Phaser.Math.Between(spawnRect.y, spawnRect.y + spawnRect.h);
                let collision = false;
                for (let p of existingPoints) {
                    const dist = p.radius || MIN_DISTANCE;
                    if (Phaser.Math.Distance.Between(x, y, p.x, p.y) < dist) {
                        collision = true; break;
                    }
                }
                if (!collision) safe = true;
            }
            existingPoints.push({ x, y });

            let item = this.add.image(x, y, key).setScale(2.0);
            item.setAngle(Phaser.Math.Between(-20, 20));
            item.setData("key", key);
            item.setInteractive({ draggable: true });
            this.roundGroup.add(item);

            item.on("pointerdown", () => {
                if (!item.active) return;
                const zh = this.foodZhMap?.[key];
                if (zh) this.speak(zh);
            });
        });

        const targetZh = targetFoodData.zh;
        const taskText = this.add.text(50, 40, `任务: 找 ${this.currentTargetCount} 个 ${targetZh}`, {
            fontFamily: '"ZCOOL KuaiLe"', fontSize: "48px", fill: "#000",
        });
        this.roundGroup.add(taskText);

        const instruction = `请给${npcData.zh}，${this.currentTargetCount}个，${targetZh}！`;
        this.instructionTimer = this.time.delayedCall(1000, () => this.speak(instruction));
    }

    gameWin() {
        this.speak("太棒了！任务完成！");
        this.fireworksManager.explode(50, 256, 300);
        this.fireworksManager.explode(80, 512, 230);
        this.fireworksManager.explode(50, 768, 300);

        let winText = this.add.text(512, 384, "胜 利 !", {
            fontFamily: '"ZCOOL KuaiLe"', fontSize: "150px", color: "#FFD700", stroke: "#FF4500", strokeThickness: 10,
            shadow: { offsetX: 5, offsetY: 5, color: "#333", blur: 5, stroke: true, fill: true },
        }).setOrigin(0.5).setScale(0).setDepth(5000);

        if (this.roundGroup) this.roundGroup.add(winText);

        this.tweens.add({
            targets: winText, scaleX: 1, scaleY: 1, angle: 360, duration: 1000, ease: "Back.out",
            onComplete: () => {
                this.tweens.add({ targets: winText, scaleX: 1.05, scaleY: 1.05, duration: 600, yoyo: true, repeat: -1 });
            },
        });

        this.time.delayedCall(4000, () => this.initRound());
    }

    speak(text) {
        if (!("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        let u = new SpeechSynthesisUtterance(text);
        u.lang = "zh-CN";
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }

    showBigNumberEffect(text) {
        let num = this.add.text(512, 384, text, {
            fontFamily: '"ZCOOL KuaiLe"', fontSize: "200px", color: "#FFF", stroke: "#000", strokeThickness: 10,
        }).setOrigin(0.5).setScale(0).setDepth(4000);

        if (this.roundGroup) this.roundGroup.add(num);

        this.tweens.add({
            targets: num, scaleX: 1.5, scaleY: 1.5, alpha: { start: 1, end: 0 }, duration: 800, ease: "Back.out",
            onComplete: () => num.destroy(),
        });
    }

    // 显示一个自动消失的提示文字
    showToast(x, y, text) {
        let toast = this.add.text(x, y, text, {
            fontFamily: '"ZCOOL KuaiLe"',
            fontSize: '24px',
            color: '#FFFF00', // 黄色字比较显眼
            stroke: '#000000',
            strokeThickness: 4,
            backgroundColor: '#000000AA',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(10000);

        // 浮动动画
        this.tweens.add({
            targets: toast,
            y: y - 20, // 往上飘一点
            alpha: 0,  // 慢慢变透明
            duration: 1000,
            ease: 'Linear',
            onComplete: () => {
                toast.destroy(); // 播完销毁
            }
        });
    }
}