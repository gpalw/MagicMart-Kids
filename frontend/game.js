// ==========================================
// 0. 全局配置与状态
// ==========================================
const TOTAL_ITEMS = 15; // 屏幕上生成的总物品数

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    backgroundColor: "#87CEEB",
    parent: "game-container",

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    input: {
        activePointers: 3,
    },

    scene: {
        preload,
        create,
    },

    // ✅ 你的代码没有用到物理系统，移除可省开销
    // physics: { ... } // removed
};

const game = new Phaser.Game(config);

// 游戏全局变量
let currentTargetKey = "";
let currentTargetCount = 0;
let currentFound = 0;
let gameStarted = false;

let fireworksManager;     // 烟花管理器
let roundGroup = null;    // ✅ 本轮所有对象都放这里，便于清理
let currentDropZone = null; // ✅ 本轮有效的 dropZone
let instructionTimer = null; // ✅ 本轮语音延迟计时器

// ✅ 快速 key -> 中文名映射（避免频繁 find）
let foodZhMap = null;


// ==========================================
// 1. 资源预加载
// ==========================================
function preload() {
    // 动态加载 foods
    GameAssets.foods.forEach((item) => {
        this.load.image(item.key, item.file);
    });

    // 动态加载 animals
    GameAssets.animals.forEach((animal) => {
        this.load.image(animal.key, animal.file);
    });

    // ✅ 生成粒子贴图
    let graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture("particle", 16, 16);
}

// ==========================================
// 2. 初始化
// ==========================================
function create() {
    // 建立 key->中文映射
    if (!foodZhMap) {
        foodZhMap = Object.fromEntries(GameAssets.foods.map((f) => [f.key, f.zh]));
    }

    // 初始化烟花系统
    createFireworks(this);

    // ✅ 只绑定一次拖拽/投放事件（避免每轮叠加导致卡顿）
    bindGlobalInputEvents(this);

    // 创建开始按钮
    createStartButton(this);
}

// ==========================================
// 3. 烟花系统
// ==========================================
function createFireworks(scene) {
    fireworksManager = scene.add.particles(0, 0, "particle", {
        speed: { min: 150, max: 500 },
        angle: { min: 0, max: 360 },
        scale: { start: 1, end: 0 },
        lifespan: 1000,
        gravityY: 300,
        tint: [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff],
        emitting: false,
    });
    fireworksManager.setDepth(10_000); // 永远在最上层一点点
}

function bindGlobalInputEvents(scene) {
    // dragstart：提到最上层（比每帧 bringToTop 更轻）
    scene.input.on("dragstart", (pointer, gameObject) => {
        gameObject.setDepth(1000);
    });

    // drag：移动
    scene.input.on("drag", (pointer, gameObject, dragX, dragY) => {
        gameObject.x = dragX;
        gameObject.y = dragY;
    });

    // dragend：没投进去就弹回
    scene.input.on("dragend", (pointer, gameObject, dropped) => {
        if (!dropped) {
            gameObject.x = gameObject.input.dragStartX;
            gameObject.y = gameObject.input.dragStartY;
        }
        gameObject.setDepth(0);
    });

    // drop：只处理本轮的 currentDropZone
    scene.input.on("drop", (pointer, gameObject, target) => {
        if (!gameStarted) return;
        if (!currentDropZone || target !== currentDropZone) return;

        const key = gameObject.getData("key");

        if (key === currentTargetKey) {
            gameObject.destroy();
            currentFound++;

            const countText = String(currentFound);
            speak(countText);
            showBigNumberEffect(scene, countText);

            if (currentFound >= currentTargetCount) {
                scene.time.delayedCall(800, () => gameWin(scene));
            }
        } else {
            const wrongZh = foodZhMap?.[key];
            const targetZh = foodZhMap?.[currentTargetKey] || "";

            if (wrongZh && targetZh) {
                speak(`这是${wrongZh}，不是${targetZh}哦`);
            }

            gameObject.x = gameObject.input.dragStartX;
            gameObject.y = gameObject.input.dragStartY;
        }
    });
}

// ==========================================
// 4. 开始按钮
// ==========================================
function createStartButton(scene) {
    let btn = scene.add
        .text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2, "点击开始游戏", {
            fontFamily: '"ZCOOL KuaiLe", "Arial", sans-serif',
            fontSize: "64px",
            fill: "#fff",
            backgroundColor: "#000",
            padding: { x: 30, y: 15 },
        })
        .setOrigin(0.5)
        .setInteractive();

    btn.on("pointerdown", () => {
        // 1) 请求全屏
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.log("全屏请求失败，可能是浏览器限制", err);
            });
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        }

        // 2) 音频解锁
        if (scene.sound?.context?.state === "suspended") {
            scene.sound.context.resume();
        }

        // 3) 开始提示
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance("游戏开始！");
            u.lang = "zh-CN";
            window.speechSynthesis.speak(u);
        }

        btn.destroy();
        gameStarted = true;
        initRound(scene);
    });
}

// ==========================================
// 5. 核心回合逻辑
// ==========================================
function initRound(scene) {
    // ✅ 清理上一轮所有对象（不动烟花）
    cleanupRound(scene);

    // ✅ 本轮 group
    roundGroup = scene.add.group();

    // 1) 生成 NPC
    const npcData = Phaser.Utils.Array.GetRandom(GameAssets.animals);
    const npc = scene.add.image(850, 600, npcData.key).setScale(1.5);
    roundGroup.add(npc);

    // 2) dropZone
    currentDropZone = scene.add.zone(850, 600, 250, 250).setRectangleDropZone(250, 250);
    roundGroup.add(currentDropZone);

    // 3) 生成任务
    const targetFood = Phaser.Utils.Array.GetRandom(GameAssets.foods);
    currentTargetKey = targetFood.key;
    currentTargetCount = Phaser.Math.Between(1, 5);
    currentFound = 0;

    // 4) 准备生成列表
    let itemsToSpawn = [];
    for (let i = 0; i < currentTargetCount; i++) itemsToSpawn.push(targetFood.key);
    for (let i = 0; i < TOTAL_ITEMS - currentTargetCount; i++) {
        const randomFood = Phaser.Utils.Array.GetRandom(GameAssets.foods);
        itemsToSpawn.push(randomFood.key);
    }
    Phaser.Utils.Array.Shuffle(itemsToSpawn);

    // 5) 生成物品
    spawnItems(scene, itemsToSpawn, targetFood, npcData);
}

function cleanupRound(scene) {
    // 清理本轮 group 中所有对象（destroy）
    if (roundGroup) {
        roundGroup.clear(true, true);
        roundGroup = null;
    }

    // 清理 dropZone 引用
    currentDropZone = null;

    // 清理延迟语音计时器
    if (instructionTimer) {
        instructionTimer.remove(false);
        instructionTimer = null;
    }

    // 清理可能未结束的语音（可选）
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}

// ==========================================
// 6. 物品生成与交互
// ==========================================
function spawnItems(scene, itemList, targetFoodData, npcData) {
    const padding = 80;
    const spawnRect = {
        x: padding,
        y: 100,
        w: 1024 - padding * 2,
        h: 500,
    };

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
                    collision = true;
                    break;
                }
            }
            if (!collision) safe = true;
        }
        existingPoints.push({ x, y });

        // 物品
        let item = scene.add.image(x, y, key).setScale(2.0);
        item.setAngle(Phaser.Math.Between(-20, 20));
        item.setData("key", key);
        item.setDepth(0);
        item.setInteractive({ draggable: true }); // ✅ 足够了，不要再 setDraggable 重复
        roundGroup.add(item);

        // 点一下读中文
        item.on("pointerdown", () => {
            if (!item.active) return;
            const zh = foodZhMap?.[key];
            if (zh) {
                // 这里不强制 cancel，让拖拽体验更稳（你想要更“强插播”可以加 cancel）
                let u = new SpeechSynthesisUtterance(zh);
                u.lang = "zh-CN";
                u.rate = 1.0;
                window.speechSynthesis.speak(u);
            }
        });

        // 呼吸动画（可选：只给部分，降低负担）
        const shouldBreathe = key === currentTargetKey || Phaser.Math.Between(1, 3) === 1;
        if (shouldBreathe) {
            scene.tweens.add({
                targets: item,
                scaleX: 2.05,
                scaleY: 2.05,
                duration: 1400 + Phaser.Math.Between(-200, 200),
                yoyo: true,
                repeat: -1,
                ease: "Sine.easeInOut",
            });
        }
    });

    // 任务文字
    const targetZh = targetFoodData.zh;
    const taskText = scene.add.text(50, 40, `任务: 找 ${currentTargetCount} 个 ${targetZh}`, {
        fontFamily: '"ZCOOL KuaiLe", "Arial", sans-serif',
        fontSize: "48px",
        fill: "#000",
    });
    roundGroup.add(taskText);

    // 延迟播报任务（避免和“游戏开始”重叠）
    const instruction = `请给${npcData.zh}，${currentTargetCount}个，${targetZh}！`;
    instructionTimer = scene.time.delayedCall(1000, () => speak(instruction));
}

// ==========================================
// 7. 胜利逻辑
// ==========================================
function gameWin(scene) {
    speak("太棒了！任务完成！");

    // 烟花炸裂
    fireworksManager.explode(50, 1024 * 0.25, 768 * 0.4);
    fireworksManager.explode(80, 1024 * 0.5, 768 * 0.3);
    fireworksManager.explode(50, 1024 * 0.75, 768 * 0.4);

    // 胜利文字
    let winText = scene.add
        .text(1024 / 2, 768 / 2, "胜 利 !", {
            fontFamily: '"ZCOOL KuaiLe", "Arial", cursive',
            fontSize: "150px",
            color: "#FFD700",
            stroke: "#FF4500",
            strokeThickness: 10,
            shadow: { offsetX: 5, offsetY: 5, color: "#333", blur: 5, stroke: true, fill: true },
        })
        .setOrigin(0.5)
        .setScale(0)
        .setDepth(5000);

    // 放进 roundGroup，下一轮能被自动清掉
    if (roundGroup) roundGroup.add(winText);

    scene.tweens.add({
        targets: winText,
        scaleX: 1,
        scaleY: 1,
        angle: 360,
        duration: 1000,
        ease: "Back.out",
        onComplete: () => {
            scene.tweens.add({
                targets: winText,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 600,
                yoyo: true,
                repeat: -1,
            });
        },
    });

    // 4秒后重开
    scene.time.delayedCall(4000, () => {
        initRound(scene);
    });
}

// ==========================================
// 8. 语音工具
// ==========================================
function speak(text) {
    if (!gameStarted) return;
    if (!("speechSynthesis" in window)) return;

    // 这里保留你原来“强插播”的感觉
    window.speechSynthesis.cancel();
    let u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

// 数字特效
function showBigNumberEffect(scene, text) {
    let num = scene.add
        .text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2, text, {
            fontFamily: '"ZCOOL KuaiLe", Arial',
            fontSize: "200px",
            color: "#FFF",
            stroke: "#000",
            strokeThickness: 10,
        })
        .setOrigin(0.5)
        .setScale(0)
        .setDepth(4000);

    if (roundGroup) roundGroup.add(num);

    scene.tweens.add({
        targets: num,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: { start: 1, end: 0 },
        duration: 800,
        ease: "Back.out",
        onComplete: () => num.destroy(),
    });
}
