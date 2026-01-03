const GameAssets = {
    // ============================================================
    // 1. 食物库 (对应 assets/food/ 文件夹)
    // ============================================================
    foods: [
        // --- 水果 ---
        { key: 'apple', file: 'assets/food/apple.png', zh: '苹果', en: 'Apple' },
        { key: 'banana', file: 'assets/food/banana.png', zh: '香蕉', en: 'Banana' },
        { key: 'avocado', file: 'assets/food/avocado.png', zh: '牛油果', en: 'Avocado' },
        { key: 'cherries', file: 'assets/food/cherries.png', zh: '樱桃', en: 'Cherries' },
        { key: 'coconut', file: 'assets/food/coconut.png', zh: '椰子', en: 'Coconut' },
        { key: 'grapes', file: 'assets/food/grapes.png', zh: '葡萄', en: 'Grapes' },
        { key: 'lemon', file: 'assets/food/lemon.png', zh: '柠檬', en: 'Lemon' },
        { key: 'orange', file: 'assets/food/orange.png', zh: '橙子', en: 'Orange' },
        { key: 'pear', file: 'assets/food/pear.png', zh: '梨', en: 'Pear' },
        { key: 'pineapple', file: 'assets/food/pineapple.png', zh: '菠萝', en: 'Pineapple' },
        { key: 'strawberry', file: 'assets/food/strawberry.png', zh: '草莓', en: 'Strawberry' },
        { key: 'watermelon', file: 'assets/food/watermelon.png', zh: '西瓜', en: 'Watermelon' },

        // --- 蔬菜 ---
        { key: 'broccoli', file: 'assets/food/broccoli.png', zh: '西兰花', en: 'Broccoli' },
        { key: 'cabbage', file: 'assets/food/cabbage.png', zh: '卷心菜', en: 'Cabbage' },
        { key: 'carrot', file: 'assets/food/carrot.png', zh: '胡萝卜', en: 'Carrot' },
        { key: 'corn', file: 'assets/food/corn.png', zh: '玉米', en: 'Corn' },
        { key: 'eggplant', file: 'assets/food/eggplant.png', zh: '茄子', en: 'Eggplant' },
        { key: 'mushroom', file: 'assets/food/mushroom.png', zh: '蘑菇', en: 'Mushroom' },
        { key: 'onion', file: 'assets/food/onion.png', zh: '洋葱', en: 'Onion' },
        { key: 'tomato', file: 'assets/food/tomato.png', zh: '西红柿', en: 'Tomato' },
        { key: 'pumpkin', file: 'assets/food/pumpkin.png', zh: '南瓜', en: 'Pumpkin' },

        // --- 主食/快餐 ---
        { key: 'bread', file: 'assets/food/bread.png', zh: '面包', en: 'Bread' },
        { key: 'burger', file: 'assets/food/burger.png', zh: '汉堡包', en: 'Burger' },
        { key: 'fries', file: 'assets/food/fries.png', zh: '薯条', en: 'Fries' },
        { key: 'hotdog', file: 'assets/food/hot-dog.png', zh: '热狗', en: 'Hot Dog' },
        { key: 'pizza', file: 'assets/food/pizza.png', zh: '披萨', en: 'Pizza' },
        { key: 'sandwich', file: 'assets/food/sandwich.png', zh: '三明治', en: 'Sandwich' },
        { key: 'sushi', file: 'assets/food/sushi-salmon.png', zh: '寿司', en: 'Sushi' },
        { key: 'taco', file: 'assets/food/taco.png', zh: '塔可', en: 'Taco' },
        { key: 'egg', file: 'assets/food/egg.png', zh: '鸡蛋', en: 'Egg' },
        { key: 'waffle', file: 'assets/food/waffle.png', zh: '华夫饼', en: 'Waffle' },

        // --- 甜点/零食 ---
        { key: 'cake', file: 'assets/food/cake.png', zh: '蛋糕', en: 'Cake' },
        { key: 'chocolate', file: 'assets/food/chocolate.png', zh: '巧克力', en: 'Chocolate' },
        { key: 'cookie', file: 'assets/food/cookie.png', zh: '曲奇饼干', en: 'Cookie' },
        { key: 'donut', file: 'assets/food/donut.png', zh: '甜甜圈', en: 'Donut' },
        { key: 'icecream', file: 'assets/food/ice-cream.png', zh: '冰淇淋', en: 'Ice Cream' },
        { key: 'pudding', file: 'assets/food/pudding.png', zh: '布丁', en: 'Pudding' },
        { key: 'lollipop', file: 'assets/food/lollypop.png', zh: '棒棒糖', en: 'Lollipop' },

        // --- 饮料 ---
        { key: 'milk', file: 'assets/food/carton.png', zh: '牛奶', en: 'Milk' },
        { key: 'coffee', file: 'assets/food/cup-coffee.png', zh: '咖啡', en: 'Coffee' },
        { key: 'soda', file: 'assets/food/soda.png', zh: '汽水', en: 'Soda' },
        { key: 'honey', file: 'assets/food/honey.png', zh: '蜂蜜', en: 'Honey' },
        { key: 'cheese', file: 'assets/food/cheese.png', zh: '芝士', en: 'Cheese' },

        // --- 餐具 ---
        { key: 'bowl', file: 'assets/food/bowl.png', zh: '碗', en: 'Bowl' },
        { key: 'cup', file: 'assets/food/cup.png', zh: '杯子', en: 'Cup' },
        { key: 'plate', file: 'assets/food/plate.png', zh: '盘子', en: 'Plate' },
        { key: 'chopstick', file: 'assets/food/chopstick.png', zh: '筷子', en: 'Chopstick' }
    ],

    // ============================================================
    // 2. 动物库 (对应 assets/animal/ 文件夹)
    // ============================================================
    animals: [
        { key: 'bear', file: 'assets/animal/bear.png', zh: '小熊' },
        { key: 'buffalo', file: 'assets/animal/buffalo.png', zh: '水牛' },
        { key: 'chick', file: 'assets/animal/chick.png', zh: '小鸡' },
        { key: 'chicken', file: 'assets/animal/chicken.png', zh: '母鸡' },
        { key: 'cow', file: 'assets/animal/cow.png', zh: '奶牛' },
        { key: 'crocodile', file: 'assets/animal/crocodile.png', zh: '鳄鱼' },
        { key: 'dog', file: 'assets/animal/dog.png', zh: '小狗' },
        { key: 'duck', file: 'assets/animal/duck.png', zh: '鸭子' },
        { key: 'elephant', file: 'assets/animal/elephant.png', zh: '大象' },
        { key: 'frog', file: 'assets/animal/frog.png', zh: '青蛙' },
        { key: 'giraffe', file: 'assets/animal/giraffe.png', zh: '长颈鹿' },
        { key: 'goat', file: 'assets/animal/goat.png', zh: '山羊' },
        { key: 'gorilla', file: 'assets/animal/gorilla.png', zh: '大猩猩' },
        { key: 'hippo', file: 'assets/animal/hippo.png', zh: '河马' },
        { key: 'horse', file: 'assets/animal/horse.png', zh: '马' },
        { key: 'monkey', file: 'assets/animal/monkey.png', zh: '猴子' },
        { key: 'moose', file: 'assets/animal/moose.png', zh: '麋鹿' },
        { key: 'narwhal', file: 'assets/animal/narwhal.png', zh: '独角鲸' },
        { key: 'owl', file: 'assets/animal/owl.png', zh: '猫头鹰' },
        { key: 'panda', file: 'assets/animal/panda.png', zh: '熊猫' },
        { key: 'parrot', file: 'assets/animal/parrot.png', zh: '鹦鹉' },
        { key: 'penguin', file: 'assets/animal/penguin.png', zh: '企鹅' },
        { key: 'pig', file: 'assets/animal/pig.png', zh: '小猪' },
        { key: 'rabbit', file: 'assets/animal/rabbit.png', zh: '兔子' },
        { key: 'rhino', file: 'assets/animal/rhino.png', zh: '犀牛' },
        { key: 'sloth', file: 'assets/animal/sloth.png', zh: '树懒' },
        { key: 'snake', file: 'assets/animal/snake.png', zh: '蛇' },
        { key: 'walrus', file: 'assets/animal/walrus.png', zh: '海象' },
        { key: 'whale', file: 'assets/animal/whale.png', zh: '鲸鱼' },
        { key: 'zebra', file: 'assets/animal/zebra.png', zh: '斑马' }
    ]
};