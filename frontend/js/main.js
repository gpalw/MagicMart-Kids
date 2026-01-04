// js/main.js

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
    // 关键：这里列出所有的场景
    // 第一个是默认启动的场景 (大厅)
    scene: [MenuScene, ShopGame, ShadowGame]
};

// 启动游戏
const game = new Phaser.Game(config);