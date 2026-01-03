// ==========================================
// 1. 全局配置与状态
// ==========================================
const TOTAL_ITEMS = 15; // 屏幕上生成的总物品数

const config = {
    type: Phaser.AUTO,
    // 逻辑分辨率，Phaser 会自动缩放适应平板
    width: 1024,
    height: 768,
    backgroundColor: '#87CEEB', // 天蓝色背景
    parent: 'game-container',

    // === 核心修改：平板全屏适配 ===
    scale: {
        mode: Phaser.Scale.FIT,       // 自动缩放填充屏幕
        autoCenter: Phaser.Scale.CENTER_BOTH // 画面始终居中
    },

    // === 核心修改：开启多指触控 ===
    input: {
        activePointers: 3, // 允许同时检测3个手指
    },

    scene: {
        preload: preload,
        create: create
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false // 上线关闭调试框
        }
    }
};

const game = new Phaser.Game(config);

// 游戏全局变量
let currentTargetKey = "";
let currentTargetCount = 0;
let currentFound = 0;
let gameStarted = false;
let fireworksManager; // 烟花管理器

// ==========================================
// 2. 资源预加载
// ==========================================
function preload() {
    // 动态加载 assets_config.js 里的食物
    GameAssets.foods.forEach(item => {
        this.load.image(item.key, item.file);
    });

    // 动态加载动物
    GameAssets.animals.forEach(animal => {
        this.load.image(animal.key, animal.file);
    });

    // === 关键：手动生成一个白色小圆点作为粒子素材 ===
    // 这样不需要额外的 particle.png 图片
    let graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('particle', 16, 16);
}

// ==========================================
// 3. 游戏初始化 (Create)
// ==========================================
function create() {
    // 初始化烟花系统
    createFireworks(this);

    // 创建开始按钮 (处理音频权限的核心)
    createStartButton(this);
}

// 创建烟花发射器 (Phaser 3.60+ 写法)
function createFireworks(scene) {
    fireworksManager = scene.add.particles(0, 0, 'particle', {
        speed: { min: 150, max: 500 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        lifespan: 1000,
        gravityY: 300,
        tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff], // 五彩斑斓
        emitting: false // 关键：默认不喷射，等赢了再炸
    });
}

// 创建开始按钮
function createStartButton(scene) {
    let btn = scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2, '点击开始游戏', {
        fontFamily: '"ZCOOL KuaiLe", "Arial", sans-serif',
        fontSize: '64px',
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 30, y: 15 }
    })
        .setOrigin(0.5)
        .setInteractive();

    // 点击事件
    btn.on('pointerdown', () => {
        // 1. === 新增：请求全屏 (必须放在点击事件里) ===
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log("全屏请求失败，可能是浏览器限制", err);
            });
        } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome/Safari */
            document.documentElement.webkitRequestFullscreen();
        }

        // 2. 音频解锁逻辑 (保持不变)
        if (scene.sound.context.state === 'suspended') {
            scene.sound.context.resume();
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            let u = new SpeechSynthesisUtterance("游戏开始！");
            u.lang = 'zh-CN';
            window.speechSynthesis.speak(u);
        }

        btn.destroy();
        gameStarted = true;
        initRound(scene);
    });
}

// ==========================================
// 4. 核心游戏循环 (Init Round)
// ==========================================
function initRound(scene) {
    // 清理旧物品
    scene.children.list.forEach(child => {
        // 保留烟花管理器，其他的清除
        if (child !== fireworksManager) {
            // 注意：这里简单清除可能会有问题，但在这种简单场景下通常可行
            // 更严谨的做法是将物品放入 Group 进行 destroy
        }
    });
    // 暴力清除除了烟花以外的所有 Image 和 Text (简单粗暴有效)
    let keepList = [fireworksManager];
    scene.children.list = scene.children.list.filter(child => keepList.includes(child));

    // --- 1. 生成顾客 (NPC) ---
    const npcData = Phaser.Utils.Array.GetRandom(GameAssets.animals);
    const npc = scene.add.image(850, 600, npcData.key).setScale(1.5); // 放大 1.5 倍

    // 顾客交互区 (Drop Zone)
    // 放在顾客位置，大小 200x200
    const dropZone = scene.add.zone(850, 600, 250, 250).setRectangleDropZone(250, 250);
    // 调试用：画出 dropZone 范围 (如果 physics.debug: true)

    // --- 2. 生成任务 ---
    const targetFood = Phaser.Utils.Array.GetRandom(GameAssets.foods);
    currentTargetKey = targetFood.key;
    currentTargetCount = Phaser.Math.Between(1, 5); // 找 1~5 个
    currentFound = 0;

    // --- 3. 准备生成列表 ---
    let itemsToSpawn = [];
    // 加目标物品
    for (let i = 0; i < currentTargetCount; i++) itemsToSpawn.push(targetFood.key);
    // 加干扰项
    for (let i = 0; i < TOTAL_ITEMS - currentTargetCount; i++) {
        let randomFood = Phaser.Utils.Array.GetRandom(GameAssets.foods);
        itemsToSpawn.push(randomFood.key);
    }
    Phaser.Utils.Array.Shuffle(itemsToSpawn); // 打乱顺序

    // --- 4. 生成物品到屏幕 ---
    spawnItems(scene, itemsToSpawn, dropZone, targetFood, npcData);
}

// ==========================================
// 5. 物品生成与交互逻辑
// ==========================================
function spawnItems(scene, itemList, dropZone, targetFoodData, npcData) {
    const padding = 80;
    const spawnRect = {
        x: padding, y: 100,
        w: 1024 - padding * 2, h: 500 // 底部留给 NPC
    };

    // 防重叠配置
    const MIN_DISTANCE = 130;
    let existingPoints = [{ x: 850, y: 600, radius: 250 }]; // 先避开 NPC

    itemList.forEach(key => {
        let x, y, safe = false, attempts = 0;

        // 寻找空位算法
        while (!safe && attempts < 50) {
            attempts++;
            x = Phaser.Math.Between(spawnRect.x, spawnRect.x + spawnRect.w);
            y = Phaser.Math.Between(spawnRect.y, spawnRect.y + spawnRect.h);

            let collision = false;
            for (let point of existingPoints) {
                let dist = point.radius || MIN_DISTANCE;
                if (Phaser.Math.Distance.Between(x, y, point.x, point.y) < dist) {
                    collision = true; break;
                }
            }
            if (!collision) safe = true;
        }
        existingPoints.push({ x: x, y: y });

        // 生成物品 Image
        let item = scene.add.image(x, y, key).setScale(2.0); // 物品放大 2.0 倍
        item.setAngle(Phaser.Math.Between(-20, 20)); // 随机旋转
        item.setData('key', key);
        item.setInteractive({ draggable: true }); // 开启拖拽
        scene.input.setDraggable(item);

        // 呼吸动画
        scene.tweens.add({
            targets: item, scaleX: 2.1, scaleY: 2.1,
            duration: 1000 + Phaser.Math.Between(-200, 200),
            yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    });

    // --- 显示任务 ---
    // 延迟播语音，防止和“开始游戏”重叠
    const instruction = `请给${npcData.zh}，${currentTargetCount}个，${targetFoodData.zh}！`;
    scene.time.delayedCall(1000, () => speak(instruction));

    // 屏幕文字
    scene.add.text(50, 40, `任务: 找 ${currentTargetCount} 个 ${targetFoodData.zh}`, {
        fontFamily: '"ZCOOL KuaiLe", "Arial", sans-serif',
        fontSize: '48px',
        fill: '#000'
    });

    // --- 拖拽事件 ---
    scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
        scene.children.bringToTop(gameObject); // 拖动时置顶
    });

    scene.input.on('dragend', (pointer, gameObject, dropped) => {
        if (!dropped) {
            // 没拖到圈里，弹回去
            gameObject.x = gameObject.input.dragStartX;
            gameObject.y = gameObject.input.dragStartY;
        }
    });

    // 移除旧的 drop 监听，防止累积
    scene.input.off('drop');

    scene.input.on('drop', (pointer, gameObject, target) => {
        // 校验逻辑
        if (gameObject.getData('key') === currentTargetKey) {
            gameObject.destroy(); // 吃掉了
            currentFound++;
            speak("对啦！"); // 简单的即时反馈

            if (currentFound >= currentTargetCount) {
                gameWin(scene);
            }
        } else {
            // 拖错了
            speak("不对哦，这个不是" + targetFoodData.zh);
            gameObject.x = gameObject.input.dragStartX;
            gameObject.y = gameObject.input.dragStartY;
        }
    });
}

// ==========================================
// 6. 胜利逻辑
// ==========================================
function gameWin(scene) {
    speak("太棒了！任务完成！");

    // 1. 烟花炸裂 (左中右三处)
    // Phaser 3.60 使用 explode(数量, x, y)
    fireworksManager.explode(50, 1024 * 0.25, 768 * 0.4);
    fireworksManager.explode(80, 1024 * 0.5, 768 * 0.3);
    fireworksManager.explode(50, 1024 * 0.75, 768 * 0.4);

    // 2. 胜利大字
    let winText = scene.add.text(1024 / 2, 768 / 2, '胜 利 !', {
        fontFamily: '"ZCOOL KuaiLe", "Arial", cursive',
        fontSize: '150px',
        color: '#FFD700',
        stroke: '#FF4500',
        strokeThickness: 10,
        shadow: { offsetX: 5, offsetY: 5, color: '#333', blur: 5, stroke: true, fill: true }
    }).setOrigin(0.5).setScale(0);

    // 3. 文字动画
    scene.tweens.add({
        targets: winText,
        scaleX: 1, scaleY: 1, angle: 360,
        duration: 1000, ease: 'Back.out',
        onComplete: () => {
            scene.tweens.add({
                targets: winText, scaleX: 1.1, scaleY: 1.1,
                duration: 500, yoyo: true, repeat: -1
            });
        }
    });

    // 4. 4秒后重开
    scene.time.delayedCall(4000, () => {
        initRound(scene);
    });
}

// ==========================================
// 7. 语音工具
// ==========================================
function speak(text) {
    if (!gameStarted) return;
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
    }
}