const canvas = document.getElementById('canvas');
const scene = new THREE.Scene();
const gameArea = document.getElementById('game-area');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.width, canvas.height);
renderer.setClearColor(0x87ceeb);
const coordX = document.getElementById('player-x');
const coordY = document.getElementById('player-y');
const maxMoveInput = document.getElementById('max-move-input');
const maxMoveValue = document.getElementById('max-move-value');

// 初始化相机
const camera = new THREE.OrthographicCamera(
    canvas.width / -2,
    canvas.width / 2,
    canvas.height / 2,
    canvas.height / -2,
    1,
    10000
);
camera.position.set(0, 0, 500);
scene.add(camera);

function resizeCanvas() {
    canvas.width = gameArea.clientWidth;
    canvas.height = gameArea.clientHeight;
    renderer.setSize(canvas.width, canvas.height);
    camera.left = canvas.width / -2;
    camera.right = canvas.width / 2;
    camera.top = canvas.height / 2;
    camera.bottom = canvas.height / -2;
    camera.updateProjectionMatrix();
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

renderer.setSize(canvas.width, canvas.height);
renderer.setClearColor(0x87ceeb);

// 创建草地背景
const GRID_SIZE = 50;
let MAX_MOVE_GRIDS = 5;
const GRASS_TILE_SIZE = GRID_SIZE;
const gridSize = GRID_SIZE;
const grassTexture = new THREE.TextureLoader().load('assets/grass.png');
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(10000, 10000);
const grassMaterial = new THREE.MeshBasicMaterial({ map: grassTexture });
const grassGeometry = new THREE.PlaneGeometry(500000, 500000);
const grass = new THREE.Mesh(grassGeometry, grassMaterial);
scene.add(grass);

// 添加虚线网格
const gridColor = 0xffffff;
const gridOpacity = 0.05;
const gridMaterial = new THREE.LineBasicMaterial({ color: gridColor, opacity: gridOpacity, transparent: true, linewidth: 1 });



// 创建主角
// 加载角色纹理
const textureLoader = new THREE.TextureLoader();
const standTexture = textureLoader.load('assets/role_stand.png');
const runTexture = textureLoader.load('assets/role_run.png');
const dieTexture = textureLoader.load('assets/role_die.png');

// 创建平面精灵
const playerGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
const playerMaterial = new THREE.MeshBasicMaterial({
    map: standTexture,
    transparent: true
});
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.rotation.z = Math.PI; // 调整纹理方向
scene.add(player);

// 随机生成主角位置
const randomX = Math.floor(Math.random() * 200 - 100) * GRID_SIZE + GRID_SIZE / 2;
const randomY = Math.floor(Math.random() * 200 - 100) * GRID_SIZE + GRID_SIZE / 2;
player.position.set(randomX, randomY, 0);

// 鼠标点击移动
// 优化鼠标点击移动
const moveSpeed = 5;
let targetPosition = player.position.clone();
function getGridCenter(screenX, screenY) {
    let gridX = Math.floor((screenX + camera.position.x) / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
    let gridY = Math.floor((screenY + camera.position.y) / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;

    // 计算玩家当前网格位置
    const playerGridX = Math.floor(player.position.x / GRID_SIZE);
    const playerGridY = Math.floor(player.position.y / GRID_SIZE);

    // 计算目标网格位置
    const targetGridX = Math.floor(gridX / GRID_SIZE);
    const targetGridY = Math.floor(gridY / GRID_SIZE);

    // 计算网格距离差
    const deltaX = targetGridX - playerGridX;
    const deltaY = targetGridY - playerGridY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > MAX_MOVE_GRIDS) {
        // 按方向限制最大移动距离
        const angle = Math.atan2(deltaY, deltaX);
        const adjustedDeltaX = Math.round(MAX_MOVE_GRIDS * Math.cos(angle));
        const adjustedDeltaY = Math.round(MAX_MOVE_GRIDS * Math.sin(angle));

        gridX = (playerGridX + adjustedDeltaX) * GRID_SIZE + GRID_SIZE / 2;
        gridY = (playerGridY + adjustedDeltaY) * GRID_SIZE + GRID_SIZE / 2;
    }

    return new THREE.Vector3(gridX, gridY, 0);
}
canvas.addEventListener('mousedown', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - canvas.width / 2;
    const mouseY = canvas.height / 2 - (event.clientY - rect.top);
    if (event.button === 0) {
        targetPosition.copy(getGridCenter(mouseX, mouseY));
    } else if (event.button === 2) {
        targetPosition.copy(player.position);
        playerMaterial.map = standTexture;
        playerMaterial.needsUpdate = true;
    }
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// 初始化HP
const hpDisplay = document.getElementById('hp-value');

let HP = 100;
const MAX_HP = 100;
let hpInterval = setInterval(() => {
    if (HP > 0) {
        hpDisplay.textContent = HP;
        HP--;
    }
    if (HP <= 0) {
        playerMaterial.map = dieTexture;
        playerMaterial.needsUpdate = true;
        clearInterval(hpInterval);
        cancelAnimationFrame(movePlayer);
        alert('游戏结束！');
    }
}, 1000);

// 加载馒头纹理
const mantouTexture = new THREE.TextureLoader().load('assets/food_mantou.png');

const MAX_MT_COUNT = 20;
// 馒头数组
const mantous = [];

// 更新馒头显示的函数
function updateMTDisplay() {
    const mtValueElement = document.getElementById('mt-value');
    if (mtValueElement) {
        mtValueElement.textContent = mantous.length;
    }
}

// 随机生成馒头
function generateMantou() {
    const MAX_DISTANCE = 10;
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.floor(Math.random() * (MAX_DISTANCE + 1));
    const rawX = player.position.x + Math.round(Math.cos(angle) * distance * GRID_SIZE);
    const rawY = player.position.y + Math.round(Math.sin(angle) * distance * GRID_SIZE);
    const gridX = Math.floor(rawX / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
    const gridY = Math.floor(rawY / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;

    // 检查目标位置是否已存在馒头
    const positionExists = mantous.some(mantou => {
        return mantou.position.x === gridX && mantou.position.y === gridY;
    });
    if (positionExists) {
        return; // 已存在则不生成新馒头
    }

    const mantouGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
    const mantouMaterial = new THREE.MeshBasicMaterial({
        map: mantouTexture,
        transparent: true
    });
    const mantou = new THREE.Mesh(mantouGeometry, mantouMaterial);
    mantou.position.set(gridX, gridY, 0);
    scene.add(mantou);
    mantous.push(mantou);

    // setTimeout(() => {
    //     scene.remove(mantou);
    //     mantous.splice(mantous.indexOf(mantou), 1);
    //     updateMTDisplay();
    // }, 20000);
}

// 初始生成3个馒头
setInterval(() => {
    // 生成新的馒头
    if (mantous.length < MAX_MT_COUNT) {
        setTimeout(() => {
            generateMantou();
        }, Math.random() * 5000);
    }
}, 3000);

// 在movePlayer函数中添加碰撞检测
function movePlayer() {
    const distance = player.position.distanceTo(targetPosition);
    const isMoving = distance > 0;

    // 切换奔跑动画
    playerMaterial.map = isMoving ? runTexture : standTexture;
    playerMaterial.needsUpdate = true;

    if (isMoving) {
        const direction = targetPosition.clone().sub(player.position).normalize();
        const step = Math.min(moveSpeed, distance);
        player.position.add(direction.multiplyScalar(step));

        // 调整角色朝向
        player.rotation.z = Math.atan2(direction.y, direction.x) + Math.PI / 2;

        if (distance <= moveSpeed) {
            player.position.copy(targetPosition);
        }
    }
    // 碰撞检测
    for (let i = mantous.length - 1; i >= 0; i--) {
        const mantou = mantous[i];
        const distance = player.position.distanceTo(mantou.position);
        if (distance < GRID_SIZE) {
            // 吃掉馒头
            scene.remove(mantou);
            mantous.splice(mantous.indexOf(mantou), 1);
            HP += 5;
            if (HP < MAX_HP) {
                hpDisplay.textContent = HP;
            } else {
                HP = MAX_HP;
                hpDisplay.textContent = MAX_HP;
            }
        }
    }

    updateMTDisplay();
    requestAnimationFrame(movePlayer);
}
movePlayer();

// 渲染循环
function animate() {
    // 相机跟随逻辑
    const offsetX = player.position.x - camera.position.x;
    const offsetY = player.position.y - camera.position.y;
    const distanceToTarget = player.position.distanceTo(targetPosition);
    if (distanceToTarget <= 2 * GRID_SIZE) {
        camera.position.x += offsetX * 0.05;
        camera.position.y += offsetY * 0.05;
        camera.updateProjectionMatrix();
        coordX.textContent = Math.floor(player.position.x / GRID_SIZE);
        coordY.textContent = Math.floor(player.position.y / GRID_SIZE);
    }
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

