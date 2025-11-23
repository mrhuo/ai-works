const canvas = document.getElementById('canvas');
const gameArea = document.getElementById('game-area');

// 游戏引擎核心
class GameEngine {
    constructor() {
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(canvas.width, canvas.height);
        this.renderer.setClearColor(0x87ceeb);
        
        // 初始化相机
        this.camera = new THREE.OrthographicCamera(
            canvas.width / -2,
            canvas.width / 2,
            canvas.height / 2,
            canvas.height / -2,
            1,
            10000
        );
        this.camera.position.set(0, 0, 500);
        this.scene.add(this.camera);
        
        // 游戏状态
        this.isRunning = false;
        this.lastTime = 0;
        this.fps = 60;
        this.frameInterval = 1000 / this.fps;
        
        // 游戏对象管理
        this.gameObjects = new Map();
        this.components = new Map();
        
        // 初始化系统
        this.initSystems();
    }
    
    initSystems() {
        // 初始化草地系统
        this.initGrassSystem();
        
        // 初始化迷雾系统
        this.initFogSystem();
        
        // 初始化UI系统
        this.initUISystem();
        
        // 初始化音效系统
        this.initAudioSystem();
    }
    
    initGrassSystem() {
        // 草地系统初始化代码...
        this.grassTiles = [];
        this.GRASS_TILE_SIZE_PIXELS = 1000;
        this.GRASS_LOAD_RADIUS = 2000;
        
        const grassTexture = new THREE.TextureLoader().load('assets/grass.png');
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(20, 20);
        
        this.grassTexture = grassTexture;
    }
    
    initFogSystem() {
        // 迷雾系统初始化代码...
        this.FOG_OF_WAR_RADIUS = 800;
        
        const fogCanvas = document.createElement('canvas');
        fogCanvas.width = 2000;
        fogCanvas.height = 2000;
        this.fogCtx = fogCanvas.getContext('2d');
        
        const fogTexture = new THREE.CanvasTexture(fogCanvas);
        const fogMaterial = new THREE.MeshBasicMaterial({
            map: fogTexture,
            transparent: true
        });
        const fogGeometry = new THREE.PlaneGeometry(2000, 2000);
        this.fogOverlay = new THREE.Mesh(fogGeometry, fogMaterial);
        this.fogOverlay.position.z = 1;
        this.scene.add(this.fogOverlay);
    }
    
    initUISystem() {
        // UI系统初始化代码...
        this.floatingTexts = [];
        this.FLOATING_TEXT_DURATION = 1000;
        this.FLOATING_TEXT_SPEED = 50;
        
        // 游戏统计
        this.HP = 100;
        this.MAX_HP = 999999;
        this.gameStartTime = Date.now();
        this.totalMantousCollected = 0;
        this.isGameOver = false;
    }
    
    initAudioSystem() {
        // 音效系统
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = new Map();
        this.backgroundMusic = null;
        this.isBackgroundMusicPlaying = false;
        this.userInteracted = false;
        this.backgroundMusicReady = false;
    }
    
    // 游戏对象管理
    addGameObject(id, gameObject) {
        this.gameObjects.set(id, gameObject);
        this.scene.add(gameObject.mesh);
    }
    
    removeGameObject(id) {
        const gameObject = this.gameObjects.get(id);
        if (gameObject) {
            this.scene.remove(gameObject.mesh);
            this.gameObjects.delete(id);
        }
    }
    
    getGameObject(id) {
        return this.gameObjects.get(id);
    }
    
    // 组件管理
    addComponent(name, component) {
        this.components.set(name, component);
    }
    
    getComponent(name) {
        return this.components.get(name);
    }

    // 检查网格位置是否有游戏对象
    isGridOccupied(gridX, gridY) {
        const GRID_SIZE = 50;
        const targetX = gridX * GRID_SIZE + GRID_SIZE / 2;
        const targetY = gridY * GRID_SIZE + GRID_SIZE / 2;
        
        for (const [id, gameObject] of this.gameObjects) {
            if (id === 'player') continue;
            
            const objectGridX = Math.floor(gameObject.mesh.position.x / GRID_SIZE);
            const objectGridY = Math.floor(gameObject.mesh.position.y / GRID_SIZE);
            
            if (objectGridX === gridX && objectGridY === gridY) {
                return true;
            }
        }
        return false;
    }

    // 根据格子位置获取游戏对象
    getGameObjectAtGrid(gridX, gridY) {
        const GRID_SIZE = 50;
        
        for (const [id, gameObject] of this.gameObjects) {
            const objectGridX = Math.floor(gameObject.mesh.position.x / GRID_SIZE);
            const objectGridY = Math.floor(gameObject.mesh.position.y / GRID_SIZE);
            
            if (objectGridX === gridX && objectGridY === gridY) {
                return gameObject;
            }
        }
        return null;
    }
    
    // 音效系统
    playSound(name, options = {}) {
        // 根据音效名称播放对应的音效
        let audioFile = '';
        let volume = 0.7;
        
        switch(name) {
            case 'player_spawn':
                // audioFile = 'assets/audios/get_mantou.mp3';
                volume = 0.8;
                break;
            case 'player_move':
                // audioFile = 'assets/audios/action_denied.mp3';
                volume = 0.5;
                break;
            case 'mantou_spawn':
                // audioFile = 'assets/audios/get_mantou.mp3';
                volume = 0.6;
                break;
            case 'mantou_eat':
                audioFile = 'assets/audios/get_mantou.mp3';
                volume = 0.8;
                break;
            case 'wallhook_spawn':
                // audioFile = 'assets/audios/get_mantou.mp3';
                volume = 0.6;
                break;
            case 'wallhook_pickup':
                audioFile = 'assets/audios/get_mantou.mp3';
                volume = 0.8;
                break;
            case 'shoe_spawn':
                // audioFile = 'assets/audios/get_mantou.mp3';
                volume = 0.6;
                break;
            case 'shoe_pickup':
                audioFile = 'assets/audios/get_mantou.mp3';
                volume = 0.8;
                break;
            case 'potion_spawn':
                // audioFile = 'assets/audios/get_mantou.mp3';
                volume = 0.6;
                break;
            case 'potion_pickup':
                audioFile = 'assets/audios/get_mantou.mp3';
                volume = 0.8;
                break;
            case 'bomb_spawn':
                // audioFile = 'assets/audios/bomb_bombed.mp3';
                volume = 0.6;
                break;
            default:
                return; // 未知音效名称
        }
        
        if (!audioFile) {
            // console.log(`音效 ${name} 未找到对应的音频文件`);
            return;
        }
        try {
            const sound = new Audio(audioFile);
            sound.volume = volume;
            sound.play().catch(error => {
                console.log(`音效 ${name} 播放失败:`, error);
            });
        } catch (error) {
            console.log(`创建音效 ${name} 失败:`, error);
        }
    }

    // 播放背景音乐
    playBackgroundMusic() {
        if (this.isBackgroundMusicPlaying) return;
        
        this.backgroundMusic = new Audio('assets/audios/game_bg.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.5;
        
        // 尝试播放背景音乐
        const playPromise = this.backgroundMusic.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isBackgroundMusicPlaying = true;
            }).catch(error => {
                console.log('背景音乐播放失败，等待用户交互:', error);
                // 设置标志，等待用户交互后重试
                this.backgroundMusicReady = true;
            });
        }
    }

    // 停止背景音乐
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            this.isBackgroundMusicPlaying = false;
        }
    }

    // 播放游戏结束音效
    playGameOverSound() {
        const gameOverSound = new Audio('assets/audios/game_over.mp3');
        gameOverSound.volume = 0.7;
        gameOverSound.play().catch(error => {
            console.log('游戏结束音效播放失败:', error);
        });
    }

    // 播放获得物品音效
    playGetItemSound() {
        const getItemSound = new Audio('assets/audios/get_mantou.mp3');
        getItemSound.volume = 0.8;
        getItemSound.play().catch(error => {
            console.log('获得物品音效播放失败:', error);
        });
    }
    
    // 游戏循环
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        
        if (deltaTime > this.frameInterval) {
            this.lastTime = currentTime - (deltaTime % this.frameInterval);
            
            // 更新所有游戏对象
            this.update(deltaTime);
            
            // 渲染场景
            this.render();
        }
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // 更新所有游戏对象
        for (const [id, gameObject] of this.gameObjects) {
            if (gameObject.isActive && gameObject.update) {
                gameObject.update(deltaTime);
            }
        }
        
        // 更新系统
        this.updateGrassSystem();
        this.updateFogOfWar();
        this.updateFloatingTexts();
        this.updateCamera();
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    // 系统更新方法
    updateGrassSystem() {
        // 计算当前相机位置对应的草地网格
        const cameraGridX = Math.floor(this.camera.position.x / this.GRASS_TILE_SIZE_PIXELS);
        const cameraGridY = Math.floor(this.camera.position.y / this.GRASS_TILE_SIZE_PIXELS);
        
        // 需要加载的草地范围
        const loadRange = Math.ceil(this.GRASS_LOAD_RADIUS / this.GRASS_TILE_SIZE_PIXELS);
        
        // 收集需要加载的草地位置
        const neededTiles = new Set();
        for (let x = cameraGridX - loadRange; x <= cameraGridX + loadRange; x++) {
            for (let y = cameraGridY - loadRange; y <= cameraGridY + loadRange; y++) {
                neededTiles.add(`${x},${y}`);
            }
        }
        
        // 移除超出范围的草地
        for (let i = this.grassTiles.length - 1; i >= 0; i--) {
            const tile = this.grassTiles[i];
            const tileGridX = Math.floor(tile.position.x / this.GRASS_TILE_SIZE_PIXELS);
            const tileGridY = Math.floor(tile.position.y / this.GRASS_TILE_SIZE_PIXELS);
            const tileKey = `${tileGridX},${tileGridY}`;
            
            if (!neededTiles.has(tileKey)) {
                this.scene.remove(tile);
                this.grassTiles.splice(i, 1);
            }
        }
        
        // 添加缺失的草地
        neededTiles.forEach(tileKey => {
            const [gridX, gridY] = tileKey.split(',').map(Number);
            const exists = this.grassTiles.some(tile => 
                Math.floor(tile.position.x / this.GRASS_TILE_SIZE_PIXELS) === gridX &&
                Math.floor(tile.position.y / this.GRASS_TILE_SIZE_PIXELS) === gridY
            );
            
            if (!exists) {
                const x = gridX * this.GRASS_TILE_SIZE_PIXELS;
                const y = gridY * this.GRASS_TILE_SIZE_PIXELS;
                const grassTile = this.createGrassTile(x, y);
                this.grassTiles.push(grassTile);
            }
        });
    }
    
    createGrassTile(x, y) {
        const grassMaterial = new THREE.MeshBasicMaterial({ map: this.grassTexture });
        const grassGeometry = new THREE.PlaneGeometry(this.GRASS_TILE_SIZE_PIXELS, this.GRASS_TILE_SIZE_PIXELS);
        const grass = new THREE.Mesh(grassGeometry, grassMaterial);
        grass.position.set(x, y, -1);
        this.scene.add(grass);
        return grass;
    }
    
    updateFogOfWar() {
        // 重新绘制迷雾
        this.fogCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.fogCtx.fillRect(0, 0, 2000, 2000);
        
        // 清除角色周围的迷雾区域
        this.fogCtx.save();
        this.fogCtx.globalCompositeOperation = 'destination-out';
        
        const player = this.getGameObject('player');
        if (player && player.mesh) {
            const viewportLeft = this.camera.position.x - 1000;
            const viewportTop = this.camera.position.y - 1000;
            const playerCenterX = player.mesh.position.x;
            const playerCenterY = player.mesh.position.y;
            
            if (playerCenterX >= viewportLeft && playerCenterX <= viewportLeft + 2000 &&
                playerCenterY >= viewportTop && playerCenterY <= viewportTop + 2000) {
                
                // 坐标转换
                const canvasPlayerX = playerCenterX - viewportLeft;
                const canvasPlayerY = 2000 - (playerCenterY - viewportTop);
                
                // 创建角色周围的探索渐变
                const playerGradient = this.fogCtx.createRadialGradient(
                    canvasPlayerX, canvasPlayerY, 0,
                    canvasPlayerX, canvasPlayerY, this.FOG_OF_WAR_RADIUS
                );
                playerGradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
                playerGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.6)');
                playerGradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.2)');
                playerGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                
                this.fogCtx.fillStyle = playerGradient;
                this.fogCtx.beginPath();
                this.fogCtx.arc(canvasPlayerX, canvasPlayerY, this.FOG_OF_WAR_RADIUS, 0, 2 * Math.PI);
                this.fogCtx.fill();
            }
        }
        
        this.fogCtx.restore();
        
        // 更新迷雾位置跟随相机
        this.fogOverlay.position.x = this.camera.position.x;
        this.fogOverlay.position.y = this.camera.position.y;
        
        // 更新纹理
        this.fogOverlay.material.map.needsUpdate = true;
    }
    
    updateFloatingTexts() {
        const now = Date.now();
        
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const floatingText = this.floatingTexts[i];
            const elapsed = now - floatingText.startTime;
            
            // 计算当前位置
            const progress = elapsed / this.FLOATING_TEXT_DURATION;
            const offsetY = -progress * this.FLOATING_TEXT_SPEED;
            
            // 更新位置
            const screenX = floatingText.startX - this.camera.position.x + canvas.width / 2;
            const screenY = canvas.height / 2 - (floatingText.startY - this.camera.position.y) + offsetY;
            
            floatingText.element.style.left = `${screenX}px`;
            floatingText.element.style.top = `${screenY}px`;
            
            // 淡出效果
            if (progress > 0.7) {
                const opacity = 1 - (progress - 0.7) / 0.3;
                floatingText.element.style.opacity = `${opacity}`;
                
                // 当透明度为0时立即移除
                if (opacity <= 0) {
                    floatingText.element.remove();
                    this.floatingTexts.splice(i, 1);
                    continue;
                }
            }
            
            // 如果超过持续时间，移除提示
            if (elapsed > this.FLOATING_TEXT_DURATION) {
                floatingText.element.remove();
                this.floatingTexts.splice(i, 1);
            }
        }
    }
    
    updateCamera() {
        const player = this.getGameObject('player');
        if (player && player.mesh) {
            const offsetX = player.mesh.position.x - this.camera.position.x;
            const offsetY = player.mesh.position.y - this.camera.position.y;
            
            this.camera.position.x += offsetX * 0.05;
            this.camera.position.y += offsetY * 0.05;
            this.camera.updateProjectionMatrix();
            
            // 更新坐标显示
            const coordX = document.getElementById('player-x');
            const coordY = document.getElementById('player-y');
            if (coordX && coordY) {
                coordX.textContent = Math.floor(player.mesh.position.x / 50);
                coordY.textContent = Math.floor(player.mesh.position.y / 50);
            }
        }
    }
    
    // 工具方法
    createFloatingText(text, color = '#ffffff') {
        const textElement = document.createElement('div');
        textElement.textContent = text;
        textElement.style.position = 'absolute';
        textElement.style.color = color;
        textElement.style.fontSize = '20px';
        textElement.style.fontWeight = 'bold';
        textElement.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
        textElement.style.pointerEvents = 'none';
        textElement.style.opacity = '0';
        textElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        textElement.style.zIndex = '999';
        
        document.body.appendChild(textElement);
        
        const player = this.getGameObject('player');
        const floatingText = {
            element: textElement,
            startTime: Date.now(),
            startX: player ? player.mesh.position.x : 0,
            startY: player ? player.mesh.position.y : 0,
            color: color
        };
        
        this.floatingTexts.push(floatingText);
        
        // 淡入效果
        setTimeout(() => {
            textElement.style.opacity = '1';
            textElement.style.transform = 'translateY(-10px)';
        }, 10);
    }

    // 创建水波纹效果
    createRippleEffect(screenX, screenY) {
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.left = `${screenX}px`;
        ripple.style.top = `${screenY}px`;
        ripple.style.width = '0px';
        ripple.style.height = '0px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '1px solid rgba(255, 255, 255, 0.8)';
        ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '998';
        ripple.style.transition = 'all 0.3s ease-out';
        
        document.body.appendChild(ripple);
        
        // 开始动画
        setTimeout(() => {
            ripple.style.width = '40px';
            ripple.style.height = '40px';
            ripple.style.opacity = '0.8';
        }, 10);
        
        // 结束动画
        setTimeout(() => {
            ripple.style.opacity = '0';
            ripple.style.width = '60px';
            ripple.style.height = '60px';
        }, 150);
        
        // 移除元素
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 450);
    }
}

// 组件基类
class Component {
    constructor(config = {}) {
        this.gameObject = null;
        this.isActive = true;
    }
    
    onAttach() {
        // 组件附加到游戏对象时调用
    }
    
    update(deltaTime) {
        // 每帧更新时调用
    }
    
    onCollision(other) {
        // 碰撞发生时调用
    }
    
    destroy() {
        this.isActive = false;
    }
}

// 基础游戏对象类
class GameObject {
    constructor(engine, config = {}) {
        this.engine = engine;
        this.id = config.id || `gameobject_${Date.now()}_${Math.random()}`;
        this.mesh = null;
        this.components = new Map();
        this.isActive = true;
        
        // 生命周期方法
        this.onSpawn = config.onSpawn;
        this.onUpdate = config.onUpdate;
        this.onCollision = config.onCollision;
        this.onDestroy = config.onDestroy;
    }
    
    spawn() {
        if (this.onSpawn) {
            this.onSpawn.call(this);
        }
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        if (this.onUpdate) {
            this.onUpdate.call(this, deltaTime);
        }
        
        // 更新所有组件
        for (const [name, component] of this.components) {
            if (component.update && component.isActive) {
                component.update(deltaTime);
            }
        }
    }
    
    onCollide(other) {
        if (!this.isActive) return;

        if (this.onCollision) {
            this.onCollision.call(this, other);
        }
        
        // 调用所有组件的碰撞方法
        for (const [name, component] of this.components) {
            if (component.onCollision && component.isActive) {
                component.onCollision(other);
            }
        }
    }
    
    destroy() {
        this.isActive = false;
        
        if (this.onDestroy) {
            this.onDestroy.call(this);
        }

        this.engine.removeGameObject(this.id);
    }
    
    addComponent(name, component) {
        this.components.set(name, component);
        component.gameObject = this;
        
        if (component.onAttach) {
            component.onAttach.call(component);
        }
    }
    
    getComponent(name) {
        return this.components.get(name);
    }
}

// 角色组件
class PlayerComponent extends Component {
    constructor(config = {}) {
        super(config);
        this.speed = config.speed || 5;
        this.targetPosition = null;
        this.isMoving = false;
        this.currentState = 'stand'; // stand, run, die
        this.animationTextures = {};
        this.animationFrame = 0;
        this.animationInterval = null;
        this.lastDirection = new THREE.Vector3(0, 1, 0); // 默认朝上
    }
    
    onAttach() {
        // 角色创建时的初始化
        const GRID_SIZE = 50;
        const playerGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
        
        const textureLoader = new THREE.TextureLoader();
        
        // 加载所有角色动画纹理
        this.animationTextures = {
            stand: textureLoader.load('assets/role_stand.png'),
            run: textureLoader.load('assets/role_run.png'),
            die: textureLoader.load('assets/role_die.png')
        };
        
        const playerMaterial = new THREE.MeshBasicMaterial({
            map: this.animationTextures.stand,
            transparent: true
        });
        
        this.gameObject.mesh = new THREE.Mesh(playerGeometry, playerMaterial);
        this.gameObject.mesh.rotation.z = Math.PI;
        
        // 随机位置
        const randomX = Math.floor(Math.random() * 200 - 100) * GRID_SIZE + GRID_SIZE / 2;
        const randomY = Math.floor(Math.random() * 200 - 100) * GRID_SIZE + GRID_SIZE / 2;
        this.gameObject.mesh.position.set(randomX, randomY, 0);
        
        this.targetPosition = this.gameObject.mesh.position.clone();
        
        // 播放出现音效
        this.gameObject.engine.playSound('player_spawn');
    }
    
    update(deltaTime) {
        if (this.currentState === 'die') return; // 死亡状态不更新
        
        // 处理弹飞动画
        if (this.isKnockback) {
            this.knockbackProgress += deltaTime;
            const progress = Math.min(this.knockbackProgress / this.knockbackDuration, 1);
            
            // 使用缓动函数让动画更平滑
            const easedProgress = this.easeOutCubic(progress);
            
            // 计算当前位置
            const currentPos = new THREE.Vector3()
                .lerpVectors(this.knockbackStartPos, this.knockbackTargetPos, easedProgress);
            
            this.gameObject.mesh.position.copy(currentPos);
            
            // 弹飞动画完成
            if (progress >= 1) {
                this.isKnockback = false;
                this.gameObject.mesh.position.copy(this.knockbackTargetPos);
                this.targetPosition.copy(this.knockbackTargetPos);
                this.isMoving = false;
                this.setState('stand');
            }
            return;
        }
        
        if (this.isMoving) {
            const distance = this.gameObject.mesh.position.distanceTo(this.targetPosition);
            const isMoving = distance > 0;

            if (isMoving) {
                const direction = this.targetPosition.clone().sub(this.gameObject.mesh.position).normalize();
                const step = Math.min(this.speed, distance);
                this.gameObject.mesh.position.add(direction.multiplyScalar(step));

                // 调整角色朝向
                this.gameObject.mesh.rotation.z = Math.atan2(direction.y, direction.x) + Math.PI / 2;
                this.lastDirection.copy(direction);

                // 切换到行走动画
                if (this.currentState !== 'run') {
                    this.setState('run');
                }

                // 在加速状态下创建拖影效果
                if (this.speedBoostActive) {
                    // 每移动一定距离创建拖影
                    if (this.trailCounter === undefined) {
                        this.trailCounter = 0;
                    }
                    this.trailCounter += step;
                    if (this.trailCounter >= 5) { // 每移动5像素创建一个拖影，更频繁
                        this.createTrailEffect();
                        this.trailCounter = 0;
                    }
                }

                if (distance <= this.speed) {
                    this.gameObject.mesh.position.copy(this.targetPosition);
                    this.isMoving = false;
                    // 切换到站立动画
                    this.setState('stand');
                }
            }
            
            // 碰撞检测
            this.checkCollisions();
        }
    }
    
    // 缓动函数 - 让弹飞动画更平滑
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    moveTo(position) {
        if (this.currentState === 'die') return; // 死亡状态不能移动
        
        this.targetPosition.copy(position);
        this.isMoving = true;
        this.gameObject.engine.playSound('player_move');
    }
    
    checkCollisions() {
        const GRID_SIZE = 50;
        const gameObjects = this.gameObject.engine.gameObjects;
        
        for (const [id, other] of gameObjects) {
            if (id === 'player') continue;
            
            // 检测与馒头、炸弹、钩子、生命药水、神速鞋、盲盒和野牛的碰撞
            if (other.getComponent && (other.getComponent('MantouComponent') || other.getComponent('BombComponent') || other.getComponent('WallHookComponent') || other.getComponent('HealthPotionComponent') || other.getComponent('SpeedShoeComponent') || other.getComponent('MysteryBoxComponent') || other.getComponent('WildCowComponent'))) {
                const distance = this.gameObject.mesh.position.distanceTo(other.mesh.position);
                
                if (distance < GRID_SIZE) {
                    console.log('玩家碰撞检测到对象:', id, '类型:', other.getComponent ? '有组件' : '无组件');
                    
                    // 检查是否是盲盒
                    if (other.getComponent('MysteryBoxComponent')) {
                        console.log('检测到盲盒碰撞!');
                    }
                    
                    // 检查是否是野牛
                    if (other.getComponent('WildCowComponent')) {
                        console.log('检测到野牛碰撞!');
                    }
                    
                    // 触发碰撞事件
                    this.gameObject.onCollide(other);
                    other.onCollide(this.gameObject);
                }
            }
        }
    }
    
    // 设置角色状态
    setState(state) {
        if (this.currentState === state) return;
        
        this.currentState = state;
        
        // 清除之前的动画间隔
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
        
        // 更新纹理
        this.gameObject.mesh.material.map = this.animationTextures[state];
        this.gameObject.mesh.material.needsUpdate = true;
        
        // 如果是死亡状态，停止移动
        if (state === 'die') {
            this.isMoving = false;
            // 可以在这里添加死亡特效或音效
        }
    }
    
    // 创建拖影效果
    createTrailEffect() {
        if (!this.speedBoostActive) return;
        
        // 创建拖影网格
        const trailGeometry = new THREE.PlaneGeometry(50, 50);
        const trailMaterial = new THREE.MeshBasicMaterial({
            map: this.animationTextures.run,
            transparent: true,
            opacity: 0.4 // 增加初始透明度
        });
        
        const trailMesh = new THREE.Mesh(trailGeometry, trailMaterial);
        trailMesh.position.copy(this.gameObject.mesh.position);
        trailMesh.rotation.copy(this.gameObject.mesh.rotation);
        
        // 添加到场景
        this.gameObject.engine.scene.add(trailMesh);
        
        // 设置拖影消失动画
        let opacity = 0.4;
        const fadeInterval = setInterval(() => {
            opacity -= 0.08; // 加快消失速度
            if (opacity <= 0) {
                clearInterval(fadeInterval);
                this.gameObject.engine.scene.remove(trailMesh);
            } else {
                trailMesh.material.opacity = opacity;
            }
        }, 40); // 加快更新频率
    }
    
    // 播放死亡动画
    playDeathAnimation() {
        this.setState('die');
        
        // 可以在这里添加死亡特效
        // 例如：播放死亡音效、显示死亡特效等
    }
    
    // 重置角色状态
    reset() {
        this.setState('stand');
        this.isMoving = false;
        this.animationFrame = 0;
    }
}

// 馒头组件
class MantouComponent extends Component {
    constructor(config = {}) {
        super(config);
        this.lifetime = config.lifetime || 20000;
        this.createdAt = Date.now();
        this.healAmount = config.healAmount || 5;
    }
    
    onAttach() {
        const GRID_SIZE = 50;
        const mantouGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
        
        const mantouTexture = new THREE.TextureLoader().load('assets/food_mantou.png');
        const mantouMaterial = new THREE.MeshBasicMaterial({
            map: mantouTexture,
            transparent: true
        });
        
        this.gameObject.mesh = new THREE.Mesh(mantouGeometry, mantouMaterial);
        
        // 播放出现音效
        this.gameObject.engine.playSound('mantou_spawn');
    }
    
    update(deltaTime) {
        // 生命周期检查
        if (Date.now() - this.createdAt > this.lifetime) {
            this.gameObject.destroy();
        }
        if (this.isActive === false) {
           this.gameObject.destroy();
        }
    }
    
    onCollision(other) {
        if (other.getComponent('PlayerComponent')) {
            // 被玩家吃掉
            this.gameObject.engine.playSound('mantou_eat');
            this.gameObject.engine.createFloatingText(`+${this.healAmount}`, '#44ff44');
            
            // 设置组件为非活动状态
            this.isActive = false;
            // 通知游戏对象销毁
            this.gameObject.destroy();
        }
    }
}

// 钩子组件
class WallHookComponent extends Component {
    constructor(config = {}) {
        super(config);
        this.lifetime = config.lifetime || 30000; // 30秒消失
        this.createdAt = Date.now();
    }
    
    onAttach() {
        const GRID_SIZE = 50;
        const wallHookGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
        
        const wallHookTexture = new THREE.TextureLoader().load('assets/item_wall_hook.png');
        const wallHookMaterial = new THREE.MeshBasicMaterial({
            map: wallHookTexture,
            transparent: true
        });
        
        this.gameObject.mesh = new THREE.Mesh(wallHookGeometry, wallHookMaterial);
        
        // 播放出现音效
        this.gameObject.engine.playSound('wallhook_spawn');
    }
    
    update(deltaTime) {
        // 生命周期检查
        if (Date.now() - this.createdAt > this.lifetime) {
            this.gameObject.destroy();
        }
        if (this.isActive === false) {
           this.gameObject.destroy();
        }
    }
    
    onCollision(other) {
        if (other.getComponent('PlayerComponent')) {
            // 被玩家拾取
            this.gameObject.engine.playSound('wallhook_pickup');
            this.gameObject.engine.createFloatingText('获得钩子!', '#ffff00');
            this.gameObject.engine.playGetItemSound();
            
            // 添加到物品栏
            const item = {
                name: '钩子',
                type: 'wallhook',
                count: 1,
                color: '#ffaa00'
            };
            
            // 尝试添加到物品栏
            const added = inventorySystem.addItem(item);
            
            if (added) {
                console.log('钩子已添加到物品栏');
            } else {
                console.log('物品栏已满，无法添加钩子');
                this.gameObject.engine.createFloatingText('物品栏已满!', '#ff4444');
            }
            
            // 设置组件为非活动状态
            this.isActive = false;
            // 通知游戏对象销毁
            this.gameObject.destroy();
        }
    }
}

// 野牛组件
class WildCowComponent extends Component {
    constructor(config = {}) {
        super(config);
        this.health = config.health || 100;
        this.maxHealth = this.health;
        this.speed = config.speed || 2;
        this.moveInterval = config.moveInterval || 3000; // 3秒移动一次
        this.moveRadius = config.moveRadius || 5; // 移动半径（格子数）
        this.spawnPosition = null; // 出生位置
        this.targetPosition = null;
        this.isMoving = false;
        this.lastMoveTime = 0;
        this.cowTextures = []; // 野牛纹理数组
        this.currentTextureIndex = 0;
        this.moveSoundCooldown = 0; // 移动音效冷却
        this.lastMooTime = 0; // 上次叫声时间
        this.mooInterval = 15000; // 15秒叫声间隔
        this.playerDetected = false; // 玩家是否被检测到
        this.mooSound = null; // 野牛叫声对象
    }
    
    onAttach() {
        const GRID_SIZE = 50;
        const cowGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
        
        // 加载4种野牛纹理
        const textureLoader = new THREE.TextureLoader();
        this.cowTextures = [
            textureLoader.load('assets/animal_cow1.png'),
            textureLoader.load('assets/animal_cow2.png'),
            textureLoader.load('assets/animal_cow3.png'),
            textureLoader.load('assets/animal_cow4.png')
        ];
        
        // 随机选择一种野牛纹理
        this.currentTextureIndex = Math.floor(Math.random() * this.cowTextures.length);
        const cowMaterial = new THREE.MeshBasicMaterial({
            map: this.cowTextures[this.currentTextureIndex],
            transparent: true
        });
        
        this.gameObject.mesh = new THREE.Mesh(cowGeometry, cowMaterial);
        
        // 确保野牛站立在格子中心
        const currentGridX = Math.floor(this.gameObject.mesh.position.x / GRID_SIZE);
        const currentGridY = Math.floor(this.gameObject.mesh.position.y / GRID_SIZE);
        this.gameObject.mesh.position.set(
            currentGridX * GRID_SIZE + GRID_SIZE / 2,
            currentGridY * GRID_SIZE + GRID_SIZE / 2,
            0
        );
        
        // 记录出生位置
        this.spawnPosition = this.gameObject.mesh.position.clone();
        
        // 设置初始移动目标
        this.setRandomTargetPosition();
    }
    
    update(deltaTime) {
        if (!this.isActive) return;
        
        // 更新移动音效冷却
        if (this.moveSoundCooldown > 0) {
            this.moveSoundCooldown -= deltaTime;
        }
        
        const currentTime = Date.now();
        
        // 检查是否需要设置新的移动目标
        if (!this.isMoving && currentTime - this.lastMoveTime > this.moveInterval) {
            this.setRandomTargetPosition();
            this.lastMoveTime = currentTime;
        }
        
        // 移动逻辑
        if (this.isMoving) {
            const distance = this.gameObject.mesh.position.distanceTo(this.targetPosition);
            
            if (distance > this.speed) {
                const direction = this.targetPosition.clone().sub(this.gameObject.mesh.position).normalize();
                this.gameObject.mesh.position.add(direction.multiplyScalar(this.speed));
                
                // 调整朝向
                this.gameObject.mesh.rotation.z = Math.atan2(direction.y, direction.x) + Math.PI / 2;
                
                // 播放移动音效（冷却时间）
                if (this.moveSoundCooldown <= 0) {
                    this.playMoveSound();
                    this.moveSoundCooldown = 2000; // 2秒冷却
                }
            } else {
                // 到达目标位置
                this.gameObject.mesh.position.copy(this.targetPosition);
                this.isMoving = false;
            }
        }
        
        // 检查玩家距离并播放叫声
        this.checkPlayerDistanceAndMoo();
        
        // 碰撞检测
        this.checkCollisions();
    }
    
    setRandomTargetPosition() {
        const GRID_SIZE = 50;
        
        // 在3x3格子范围内随机选择一个相邻格子
        const directions = [
            { dx: 0, dy: 1 },   // 上
            { dx: 1, dy: 0 },   // 右
            { dx: 0, dy: -1 },  // 下
            { dx: -1, dy: 0 }   // 左
        ];
        
        // 随机选择一个方向
        const direction = directions[Math.floor(Math.random() * directions.length)];
        
        // 计算当前网格位置
        const currentGridX = Math.floor(this.gameObject.mesh.position.x / GRID_SIZE);
        const currentGridY = Math.floor(this.gameObject.mesh.position.y / GRID_SIZE);
        
        // 计算目标网格位置（在3x3范围内）
        const targetGridX = currentGridX + direction.dx;
        const targetGridY = currentGridY + direction.dy;
        
        // 确保目标位置在3x3范围内（相对于出生位置）
        const spawnGridX = Math.floor(this.spawnPosition.x / GRID_SIZE);
        const spawnGridY = Math.floor(this.spawnPosition.y / GRID_SIZE);
        
        const maxDistance = 1; // 3x3范围，距离出生位置最多1格
        if (Math.abs(targetGridX - spawnGridX) > maxDistance || 
            Math.abs(targetGridY - spawnGridY) > maxDistance) {
            // 如果超出范围，选择相反方向
            this.targetPosition = new THREE.Vector3(
                spawnGridX * GRID_SIZE + GRID_SIZE / 2,
                spawnGridY * GRID_SIZE + GRID_SIZE / 2,
                0
            );
        } else {
            // 在范围内，设置目标位置
            this.targetPosition = new THREE.Vector3(
                targetGridX * GRID_SIZE + GRID_SIZE / 2,
                targetGridY * GRID_SIZE + GRID_SIZE / 2,
                0
            );
        }
        
        this.isMoving = true;
    }
    
    playMoveSound() {
        try {
            const moveSound = new Audio('assets/audios/animal_cow.mp3');
            moveSound.volume = 0.6;
            moveSound.play().catch(error => {
                console.log('野牛移动音效播放失败:', error);
            });
        } catch (error) {
            console.log('创建野牛移动音效失败:', error);
        }
    }
    
    checkCollisions() {
        const GRID_SIZE = 50;
        const player = this.gameObject.engine.getGameObject('player');
        
        if (player) {
            const distance = this.gameObject.mesh.position.distanceTo(player.mesh.position);
            
            if (distance < GRID_SIZE) {
                // 触发碰撞
                this.gameObject.onCollide(player);
                player.onCollide(this.gameObject);
            }
        }
    }
    
    onCollision(other) {
        if (other.getComponent('PlayerComponent')) {
            // 玩家碰撞野牛
            this.gameObject.engine.createFloatingText('-50', '#ff4444');
            this.gameObject.engine.createFloatingText('野牛攻击!', '#ff8800');
            
            // 玩家生命值减少50
            this.gameObject.engine.HP -= 50;
            
            // 野牛生命值减少5
            this.health -= 5;
            
            // 检查玩家是否死亡
            if (this.gameObject.engine.HP <= 0) {
                this.gameObject.engine.HP = 0;
                gameOver();
            }
            
            // 检查野牛是否死亡
            if (this.health <= 0) {
                this.gameObject.engine.createFloatingText('野牛死亡!', '#44ff44');
                this.isActive = false;
                this.gameObject.destroy();
            }
            
            // 更新HP显示
            const hpDisplay = document.getElementById('hp-value');
            if (hpDisplay) {
                hpDisplay.textContent = this.gameObject.engine.HP;
            }
            
            // 播放受伤音效
            const hurtSound = new Audio('assets/audios/bomb_bombed.mp3');
            hurtSound.volume = 0.7;
            hurtSound.play().catch(error => {
                console.log('受伤音效播放失败:', error);
            });
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.isActive = false;
            this.gameObject.destroy();
        }
    }
    
    // 检查玩家距离并播放叫声
    checkPlayerDistanceAndMoo() {
        const player = this.gameObject.engine.getGameObject('player');
        if (!player) return;
        
        const currentTime = Date.now();
        const distance = this.gameObject.mesh.position.distanceTo(player.mesh.position);
        
        // 如果玩家在10格范围内（500像素），并且距离上次叫声超过15秒
        if (distance <= 500 && currentTime - this.lastMooTime > this.mooInterval) {
            this.playMooSound(distance);
            this.lastMooTime = currentTime;
        }
    }
    
    // 播放野牛叫声，音量随距离调整
    playMooSound(distance) {
        try {
            // 计算音量：距离越近音量越大，最大0.8，最小0.1
            const maxDistance = 500; // 10格
            const volume = Math.max(0.1, 0.8 * (1 - distance / maxDistance));
            
            // 创建新的音效对象
            const mooSound = new Audio('assets/audios/animal_cow.mp3');
            mooSound.volume = volume;
            mooSound.play().catch(error => {
                console.log('野牛叫声播放失败:', error);
            });
            
            // 显示叫声提示
            this.gameObject.engine.createFloatingText('哞~', '#ffaa00');
            
        } catch (error) {
            console.log('创建野牛叫声失败:', error);
        }
    }
}

// 盲盒组件
class MysteryBoxComponent extends Component {
    constructor(config = {}) {
        super(config);
        this.lifetime = config.lifetime || 45000; // 45秒消失
        this.createdAt = Date.now();
        // 随机生成盲盒内容
        this.contents = this.generateRandomContents();
    }
    
    onAttach() {
        const GRID_SIZE = 50;
        const boxGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
        
        const boxTexture = new THREE.TextureLoader().load('assets/item_box.png');
        const boxMaterial = new THREE.MeshBasicMaterial({
            map: boxTexture,
            transparent: true
        });
        
        this.gameObject.mesh = new THREE.Mesh(boxGeometry, boxMaterial);
        
        // 播放出现音效
        this.gameObject.engine.playSound('mysterybox_spawn');
    }
    
    update(deltaTime) {
        // 生命周期检查
        if (Date.now() - this.createdAt > this.lifetime) {
            this.gameObject.destroy();
        }
        if (this.isActive === false) {
           this.gameObject.destroy();
        }
    }
    
    onCollision(other) {
        console.log('盲盒碰撞检测开始');
        console.log('other:', other);
        console.log('other.getComponent:', other.getComponent);
        
        if (other.getComponent && other.getComponent('PlayerComponent')) {
            console.log('检测到玩家碰撞，开始处理盲盒拾取');
            
            // 被玩家拾取
            this.gameObject.engine.playSound('mysterybox_pickup');
            this.gameObject.engine.createFloatingText('获得盲盒!', '#ff69b4');
            
            // 播放获得盲盒音效
            const getBoxSound = new Audio('assets/audios/get_box.mp3');
            getBoxSound.volume = 0.8;
            getBoxSound.play().catch(error => {
                console.log('获得盲盒音效播放失败:', error);
            });
            
            // 添加到物品栏
            const item = {
                name: '盲盒',
                type: 'mysterybox',
                count: 1,
                color: '#ff69b4',
                contents: this.contents // 保存盲盒内容
            };
            
            console.log('盲盒内容:', this.contents);
            
            // 尝试添加到物品栏
            const added = inventorySystem.addItem(item);
            
            if (added) {
                console.log('盲盒已添加到物品栏');
            } else {
                console.log('物品栏已满，无法添加盲盒');
                this.gameObject.engine.createFloatingText('物品栏已满!', '#ff4444');
            }
            
            // 设置组件为非活动状态
            this.isActive = false;
            // 通知游戏对象销毁
            this.gameObject.destroy();
        } else {
            console.log('盲盒碰撞检测失败：没有找到PlayerComponent或getComponent方法');
        }
    }
    
    // 生成随机盲盒内容
    generateRandomContents() {
        const itemTypes = [
            { type: 'mantou', name: '馒头', weight: 30 },
            { type: 'healthpotion', name: '生命药水', weight: 15 },
            { type: 'wallhook', name: '钩子', weight: 20 },
            { type: 'speedshoe', name: '神速鞋', weight: 10 },
            { type: 'bomb', name: '炸弹', weight: 25 }
        ];
        
        // 根据权重随机选择物品类型
        const totalWeight = itemTypes.reduce((sum, item) => sum + item.weight, 0);
        let randomWeight = Math.random() * totalWeight;
        
        let selectedType = itemTypes[0];
        for (const item of itemTypes) {
            randomWeight -= item.weight;
            if (randomWeight <= 0) {
                selectedType = item;
                break;
            }
        }
        
        // 随机数量（1-3个）
        const count = Math.floor(Math.random() * 3) + 1;
        
        return {
            type: selectedType.type,
            name: selectedType.name,
            count: count
        };
    }
}

// 神速鞋组件
class SpeedShoeComponent extends Component {
    constructor(config = {}) {
        super(config);
        this.lifetime = config.lifetime || 30000; // 30秒消失
        this.createdAt = Date.now();
    }
    
    onAttach() {
        const GRID_SIZE = 50;
        const shoeGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
        
        const shoeTexture = new THREE.TextureLoader().load('assets/item_shoe.png');
        const shoeMaterial = new THREE.MeshBasicMaterial({
            map: shoeTexture,
            transparent: true
        });
        
        this.gameObject.mesh = new THREE.Mesh(shoeGeometry, shoeMaterial);
        
        // 播放出现音效
        this.gameObject.engine.playSound('shoe_spawn');
    }
    
    update(deltaTime) {
        // 生命周期检查
        if (Date.now() - this.createdAt > this.lifetime) {
            this.gameObject.destroy();
        }
        if (this.isActive === false) {
           this.gameObject.destroy();
        }
    }
    
    onCollision(other) {
        if (other.getComponent) {
            const playerComponent = other.getComponent('PlayerComponent');
            
            if (playerComponent) {
                // 被玩家拾取，直接生效
                this.gameObject.engine.playSound('shoe_pickup');
                this.gameObject.engine.playGetItemSound();
                
                // 检查是否已经有速度加成
                if (playerComponent.speedBoostActive) {
                    // 已经有速度加成，只增加持续时间
                    playerComponent.speedBoostDuration += 20000; // 增加20秒
                    this.gameObject.engine.createFloatingText('速度加成延长!', '#00ffff');
                } else {
                    // 第一次获得速度加成
                    playerComponent.speedBoostActive = true;
                    playerComponent.originalSpeed = playerComponent.speed;
                    playerComponent.speedBoostDuration = 20000; // 20秒
                    
                    // 速度翻倍
                    playerComponent.speed = playerComponent.originalSpeed * 2;
                    this.gameObject.engine.createFloatingText('速度翻倍!', '#00ffff');
                    
                    // 启动计时器
                    playerComponent.speedBoostTimer = setTimeout(() => {
                        if (playerComponent && playerComponent.speedBoostActive) {
                            playerComponent.speed = playerComponent.originalSpeed;
                            playerComponent.speedBoostActive = false;
                            this.gameObject.engine.createFloatingText('速度恢复正常', '#00ffff');
                        }
                    }, playerComponent.speedBoostDuration);
                }
                
                // 立即设置组件为非活动状态
                this.isActive = false;
                // 立即通知游戏对象销毁
                this.gameObject.destroy();
            }
        }
    }
}

// 生命药水组件
class HealthPotionComponent extends Component {
    constructor(config = {}) {
        super(config);
        this.lifetime = config.lifetime || 60000; // 60秒消失
        this.createdAt = Date.now();
        this.healAmount = config.healAmount || 20;
    }
    
    onAttach() {
        const GRID_SIZE = 50;
        const potionGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
        
        const potionTexture = new THREE.TextureLoader().load('assets/item_health_potion.png');
        const potionMaterial = new THREE.MeshBasicMaterial({
            map: potionTexture,
            transparent: true
        });
        
        this.gameObject.mesh = new THREE.Mesh(potionGeometry, potionMaterial);
        
        // 播放出现音效
        this.gameObject.engine.playSound('potion_spawn');
    }
    
    update(deltaTime) {
        // 生命周期检查
        if (Date.now() - this.createdAt > this.lifetime) {
            this.gameObject.destroy();
        }
        if (this.isActive === false) {
           this.gameObject.destroy();
        }
    }
    
    onCollision(other) {
        if (other.getComponent && other.getComponent('PlayerComponent')) {
            // 被玩家拾取，直接增加HP
            this.gameObject.engine.playSound('potion_pickup');
            this.gameObject.engine.createFloatingText(`+${this.healAmount}`, '#ff69b4');
            this.gameObject.engine.playGetItemSound();
            
            // 增加玩家HP
            this.gameObject.engine.HP += this.healAmount;
            
            // 检查HP上限
            if (this.gameObject.engine.HP > this.gameObject.engine.MAX_HP) {
                this.gameObject.engine.HP = this.gameObject.engine.MAX_HP;
            }
            
            // 更新HP显示
            const hpDisplay = document.getElementById('hp-value');
            if (hpDisplay) {
                hpDisplay.textContent = this.gameObject.engine.HP;
            }
            
            // 立即设置组件为非活动状态
            this.isActive = false;
            // 立即通知游戏对象销毁
            this.gameObject.destroy();
        } else {
            console.log('生命药水碰撞检测失败：没有找到PlayerComponent或getComponent方法');
        }
    }
}

// 炸弹组件
class BombComponent extends Component {
    constructor(config = {}) {
        super(config);
        this.lifetime = config.lifetime || 15000;
        this.createdAt = Date.now();
        this.damageAmount = config.damageAmount || 10;
        this.currentState = 'normal'; // normal, bombing, die
        this.animationTextures = [];
        this.animationFrame = 0;
        this.animationInterval = null;
        this.isExploding = false;
    }
    
    onAttach() {
        const GRID_SIZE = 50;
        const bombGeometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE);
        
        // 加载三张炸弹图片
        const textureLoader = new THREE.TextureLoader();
        this.animationTextures = [
            textureLoader.load('assets/weapon_bomb_normal.png'),
            textureLoader.load('assets/weapon_bomb_bombing.png'),
            textureLoader.load('assets/weapon_bomb_die.png')
        ];
        
        const bombMaterial = new THREE.MeshBasicMaterial({
            map: this.animationTextures[0],
            transparent: true
        });
        
        this.gameObject.mesh = new THREE.Mesh(bombGeometry, bombMaterial);
        
        // 播放出现音效
        this.gameObject.engine.playSound('bomb_spawn');
    }
    
    update(deltaTime) {
        // 生命周期检查
        if (Date.now() - this.createdAt > this.lifetime && !this.isExploding) {
            this.gameObject.destroy();
        }
        if (this.isActive === false && !this.isExploding) {
           this.gameObject.destroy();
        }
    }
    
    playExplosionAnimation() {
        if (this.isExploding) return;
        
        this.isExploding = true;
        this.animationFrame = 0;
        
        // 播放爆炸音效
        const bombExplosionSound = new Audio('assets/audios/bomb_bombed.mp3');
        bombExplosionSound.volume = 0.8;
        bombExplosionSound.play().catch(error => {
            console.log('炸弹爆炸音效播放失败:', error);
        });
        
        // 开始动画播放
        this.animationInterval = setInterval(() => {
            this.animationFrame++;
            
            if (this.animationFrame < this.animationTextures.length) {
                // 切换到下一帧
                this.gameObject.mesh.material.map = this.animationTextures[this.animationFrame];
                this.gameObject.mesh.material.needsUpdate = true;
            } else {
                // 动画播放完成，销毁炸弹
                clearInterval(this.animationInterval);
                this.isActive = false;
                this.gameObject.destroy();
            }
        }, 200); // 每帧200毫秒
    }
    
    onCollision(other) {
        if (other.getComponent('PlayerComponent') && !this.isExploding) {
            // 显示伤害提示
            this.gameObject.engine.createFloatingText(`-${this.damageAmount}`, '#ff4444');
            
            // 减少玩家HP
            this.gameObject.engine.HP -= this.damageAmount;
            
            // 检查玩家是否死亡
            if (this.gameObject.engine.HP <= 0) {
                this.gameObject.engine.HP = 0;
                gameOver();
            }
            
            // 更新HP显示
            const hpDisplay = document.getElementById('hp-value');
            if (hpDisplay) {
                hpDisplay.textContent = this.gameObject.engine.HP;
            }
            
            // 弹飞角色
            this.knockbackPlayer(other);
            
            // 播放爆炸动画
            this.playExplosionAnimation();
        }
    }
    
    // 弹飞角色
    knockbackPlayer(player) {
        const GRID_SIZE = 50;
        const KNOCKBACK_DISTANCE = 3; // 3个格子
        
        // 计算炸弹到角色的方向
        const bombPos = this.gameObject.mesh.position;
        const playerPos = player.mesh.position;
        const direction = new THREE.Vector3()
            .subVectors(playerPos, bombPos)
            .normalize();
        
        // 如果方向为零向量（角色和炸弹在同一位置），随机选择一个方向
        if (direction.length() === 0) {
            const randomAngle = Math.random() * 2 * Math.PI;
            direction.set(Math.cos(randomAngle), Math.sin(randomAngle), 0);
        }
        
        // 计算弹飞目标位置
        const targetPos = new THREE.Vector3()
            .copy(bombPos)
            .add(direction.multiplyScalar(KNOCKBACK_DISTANCE * GRID_SIZE));
        
        // 确保目标位置在网格中心
        const targetGridX = Math.floor(targetPos.x / GRID_SIZE);
        const targetGridY = Math.floor(targetPos.y / GRID_SIZE);
        const finalPos = new THREE.Vector3(
            targetGridX * GRID_SIZE + GRID_SIZE / 2,
            targetGridY * GRID_SIZE + GRID_SIZE / 2,
            0
        );
        
        // 如果角色有PlayerComponent，设置弹飞动画
        const playerComponent = player.getComponent('PlayerComponent');
        if (playerComponent) {
            // 设置弹飞状态
            playerComponent.isKnockback = true;
            playerComponent.knockbackStartPos = playerPos.clone();
            playerComponent.knockbackTargetPos = finalPos.clone();
            playerComponent.knockbackProgress = 0;
            playerComponent.knockbackDuration = 500; // 500毫秒的弹飞动画
            
            // 停止之前的移动
            playerComponent.isMoving = false;
        } else {
            // 如果没有PlayerComponent，立即移动
            player.mesh.position.copy(finalPos);
        }
        
        // 显示弹飞提示
        this.gameObject.engine.createFloatingText('弹飞!', '#ff8800');
    }
}

// 物品栏系统
class InventorySystem {
    constructor() {
        this.slots = new Array(5).fill(null); // 5个物品栏格子
        this.selectedSlot = -1; // 当前选中的格子索引
        this.init();
    }
    
    init() {
        // 初始化物品栏事件监听
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                this.selectSlot(index);
            });
            
            // 添加鼠标悬停事件监听
            slot.addEventListener('mouseenter', (e) => {
                this.showItemTooltip(e, index);
            });
            
            slot.addEventListener('mouseleave', () => {
                this.hideItemTooltip();
            });
        });
        
        // 添加鼠标右键事件监听
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.useSelectedItem(e);
        });
        
        // 创建提示框元素
        this.createTooltipElement();
    }
    
    // 选择物品栏格子（点击切换选中状态）
    selectSlot(index) {
        // 如果点击的是当前选中的格子，取消选中
        if (this.selectedSlot === index) {
            const currentSlot = document.querySelector(`.inventory-slot[data-slot="${index}"]`);
            currentSlot.classList.remove('selected');
            this.selectedSlot = -1;
            console.log(`取消选择物品栏格子 ${index}`);
        } else {
            // 取消之前的选择
            if (this.selectedSlot !== -1) {
                const prevSlot = document.querySelector(`.inventory-slot[data-slot="${this.selectedSlot}"]`);
                prevSlot.classList.remove('selected');
            }
            
            // 选择新的格子
            this.selectedSlot = index;
            const currentSlot = document.querySelector(`.inventory-slot[data-slot="${index}"]`);
            currentSlot.classList.add('selected');
            
            console.log(`选择了物品栏格子 ${index}`);
        }
    }
    
    // 使用选中的物品
    useSelectedItem(event) {
        if (this.selectedSlot === -1 || !this.slots[this.selectedSlot]) {
            // 没有选中物品或格子为空时显示提示
            gameEngine.createFloatingText('没有选中道具', '#ff4444');
            
            // 播放操作被拒绝音效
            const actionDeniedSound = new Audio('assets/audios/action_denied.mp3');
            actionDeniedSound.volume = 0.7;
            actionDeniedSound.play().catch(error => {
                console.log('操作被拒绝音效播放失败:', error);
            });
            
            return;
        }
        
        const item = this.slots[this.selectedSlot];
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left - canvas.width / 2;
        const mouseY = canvas.height / 2 - (event.clientY - rect.top);
        
        // 计算目标位置
        const targetPosition = this.getGridCenter(mouseX, mouseY, item.type === 'wallhook');
        
        // 根据物品类型执行不同的使用逻辑
        if (item.type === 'wallhook') {
            this.useWallHook(targetPosition);
        } else if (item.type === 'mysterybox') {
            this.useMysteryBox();
        } else {
            // 其他物品的使用逻辑
            console.log(`使用物品: ${item.name} 在位置 (${targetPosition.x}, ${targetPosition.y})`);
            gameEngine.createFloatingText(`使用 ${item.name}`, '#ffff00');
        }
    }
    
    // 使用钩子
    useWallHook(targetPosition) {
        const GRID_SIZE = 50;
        const targetGridX = Math.floor(targetPosition.x / GRID_SIZE);
        const targetGridY = Math.floor(targetPosition.y / GRID_SIZE);
        
        // 检查目标是否在以玩家为中心的8格半径范围内
        const player = gameEngine.getGameObject('player');
        if (!player) return;
        
        const playerGridX = Math.floor(player.mesh.position.x / GRID_SIZE);
        const playerGridY = Math.floor(player.mesh.position.y / GRID_SIZE);
        
        // 计算玩家与目标之间的实际距离（使用欧几里得距离）
        const deltaX = targetGridX - playerGridX;
        const deltaY = targetGridY - playerGridY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 8) {
            // 目标超出8格半径范围
            gameEngine.createFloatingText('超出钩子范围!', '#ff4444');
            
            // 播放操作被拒绝音效
            const actionDeniedSound = new Audio('assets/audios/action_denied.mp3');
            actionDeniedSound.volume = 0.7;
            actionDeniedSound.play().catch(error => {
                console.log('操作被拒绝音效播放失败:', error);
            });
            return;
        }
        
        // 查找目标位置上的游戏对象
        const targetObject = gameEngine.getGameObjectAtGrid(targetGridX, targetGridY);
        
        if (targetObject) {
            const player = gameEngine.getGameObject('player');
            if (!player) return;
            
            // 检查目标对象类型
            if (targetObject.getComponent('MantouComponent')) {
                // 拉回馒头
                this.pullObjectToPlayer(targetObject, player);
                gameEngine.createFloatingText('拉回馒头!', '#44ff44');
                
                // 消耗钩子
                this.consumeItem(this.selectedSlot);
                
            } else if (targetObject.getComponent('BombComponent')) {
                // 拉回炸弹并弹飞角色
                this.pullBombToPlayer(targetObject, player);
                gameEngine.createFloatingText('拉回炸弹!', '#ff8800');
                
                // 消耗钩子
                this.consumeItem(this.selectedSlot);
                
            } else if (targetObject.getComponent('HealthPotionComponent')) {
                // 拉回生命药水
                this.pullObjectToPlayer(targetObject, player);
                gameEngine.createFloatingText('拉回生命药水!', '#ff69b4');
                
                // 消耗钩子
                this.consumeItem(this.selectedSlot);
                
            } else if (targetObject.getComponent('WallHookComponent')) {
                // 拉回钩子
                this.pullObjectToPlayer(targetObject, player);
                this.gameObject.engine.createFloatingText('拉回钩子!', '#ffff00');
                
                // 消耗钩子
                this.consumeItem(this.selectedSlot);
                
            } else if (targetObject.getComponent('MysteryBoxComponent')) {
                // 拉回盲盒
                this.pullObjectToPlayer(targetObject, player);
                this.gameObject.engine.createFloatingText('拉回盲盒!', '#ff69b4');
                
                // 消耗钩子
                this.consumeItem(this.selectedSlot);
                
            } else if (targetObject.getComponent('SpeedShoeComponent')) {
                // 拉回神速鞋
                this.pullObjectToPlayer(targetObject, player);
                this.gameObject.engine.createFloatingText('拉回神速鞋!', '#00ffff');
                
                // 消耗钩子
                this.consumeItem(this.selectedSlot);
                
            } else {
                // 目标不是可拉取的对象
                this.gameObject.engine.createFloatingText('无效目标', '#ff4444');
            }
        } else {
            // 目标位置没有对象
            gameEngine.createFloatingText('没有目标', '#ff4444');
        }
    }
    
    // 使用盲盒
    useMysteryBox() {
        const item = this.slots[this.selectedSlot];
        if (!item || !item.contents) return;
        
        // 获取盲盒内容
        const contents = item.contents;
        
        // 显示开盒提示
        gameEngine.createFloatingText(`获得 ${contents.name} x${contents.count}!`, '#ff69b4');
        
        // 根据内容类型执行不同的逻辑
        switch(contents.type) {
            case 'mantou':
                // 直接增加HP（每个馒头+5HP）
                const mantouHealAmount = 5 * contents.count;
                gameEngine.HP += mantouHealAmount;
                if (gameEngine.HP > gameEngine.MAX_HP) {
                    gameEngine.HP = gameEngine.MAX_HP;
                }
                gameEngine.createFloatingText(`+${mantouHealAmount} HP`, '#44ff44');
                
                // 更新HP显示
                const hpDisplay = document.getElementById('hp-value');
                if (hpDisplay) {
                    hpDisplay.textContent = gameEngine.HP;
                }
                break;
            case 'healthpotion':
                // 直接增加HP（每个药水+20HP）
                const healAmount = 20 * contents.count;
                gameEngine.HP += healAmount;
                if (gameEngine.HP > gameEngine.MAX_HP) {
                    gameEngine.HP = gameEngine.MAX_HP;
                }
                gameEngine.createFloatingText(`+${healAmount} HP`, '#ff69b4');
                
                // 更新HP显示
                const hpDisplay2 = document.getElementById('hp-value');
                if (hpDisplay2) {
                    hpDisplay2.textContent = gameEngine.HP;
                }
                break;
            case 'wallhook':
                // 添加到物品栏
                const wallhookItem = {
                    name: '钩子',
                    type: 'wallhook',
                    count: contents.count,
                    color: '#ffaa00'
                };
                const wallhookAdded = this.addItem(wallhookItem);
                if (!wallhookAdded) {
                    gameEngine.createFloatingText('物品栏已满!', '#ff4444');
                }
                break;
            case 'speedshoe':
                // 直接应用速度加成
                const player = gameEngine.getGameObject('player');
                if (player && player.getComponent('PlayerComponent')) {
                    const playerComponent = player.getComponent('PlayerComponent');
                    
                    // 检查是否已经有速度加成
                    if (playerComponent.speedBoostActive) {
                        // 已经有速度加成，只增加持续时间
                        playerComponent.speedBoostDuration += 20000 * contents.count; // 增加20秒 * 数量
                        gameEngine.createFloatingText(`速度加成延长 ${contents.count * 20}秒!`, '#00ffff');
                    } else {
                        // 第一次获得速度加成
                        playerComponent.speedBoostActive = true;
                        playerComponent.originalSpeed = playerComponent.speed;
                        playerComponent.speedBoostDuration = 20000 * contents.count; // 20秒 * 数量
                        
                        // 速度翻倍
                        playerComponent.speed = playerComponent.originalSpeed * 2;
                        gameEngine.createFloatingText(`速度翻倍 ${contents.count * 20}秒!`, '#00ffff');
                        
                        // 启动计时器
                        playerComponent.speedBoostTimer = setTimeout(() => {
                            if (playerComponent && playerComponent.speedBoostActive) {
                                playerComponent.speed = playerComponent.originalSpeed;
                                playerComponent.speedBoostActive = false;
                                gameEngine.createFloatingText('速度恢复正常', '#00ffff');
                            }
                        }, playerComponent.speedBoostDuration);
                    }
                }
                break;
            case 'bomb':
                // 直接引爆所有炸弹，对玩家造成伤害
                const bombDamage = 10 * contents.count;
                gameEngine.HP -= bombDamage;
                
                // 检查玩家是否死亡
                if (gameEngine.HP <= 0) {
                    gameEngine.HP = 0;
                    gameOver();
                }
                
                // 显示伤害提示
                gameEngine.createFloatingText(`-${bombDamage}`, '#ff4444');
                gameEngine.createFloatingText('炸弹爆炸!', '#ff8800');
                
                // 更新HP显示
                const hpDisplay3 = document.getElementById('hp-value');
                if (hpDisplay3) {
                    hpDisplay3.textContent = gameEngine.HP;
                }
                
                // 播放爆炸音效
                const bombExplosionSound = new Audio('assets/audios/bomb_bombed.mp3');
                bombExplosionSound.volume = 0.8;
                bombExplosionSound.play().catch(error => {
                    console.log('炸弹爆炸音效播放失败:', error);
                });
                break;
        }
        
        // 消耗盲盒
        this.consumeItem(this.selectedSlot);
    }
    
    
    // 拉回对象到玩家位置
    pullObjectToPlayer(targetObject, player) {
        const playerPos = player.mesh.position.clone();
        
        // 创建拉回动画
        const startPos = targetObject.mesh.position.clone();
        const duration = 300; // 300毫秒的拉回动画
        
        let progress = 0;
        const animatePull = () => {
            progress += 16; // 约60fps
            const t = Math.min(progress / duration, 1);
            
            // 使用缓动函数
            const easedT = this.easeOutCubic(t);
            
            // 计算当前位置
            const currentPos = new THREE.Vector3()
                .lerpVectors(startPos, playerPos, easedT);
            
            targetObject.mesh.position.copy(currentPos);
            
            if (t < 1) {
                requestAnimationFrame(animatePull);
            } else {
                // 拉回完成，触发碰撞
                targetObject.onCollide(player);
            }
        };
        
        animatePull();
    }
    
    // 拉回炸弹并弹飞角色
    pullBombToPlayer(bombObject, player) {
        const playerPos = player.mesh.position.clone();
        
        // 创建拉回动画
        const startPos = bombObject.mesh.position.clone();
        const duration = 300; // 300毫秒的拉回动画
        
        let progress = 0;
        const animatePull = () => {
            progress += 16; // 约60fps
            const t = Math.min(progress / duration, 1);
            
            // 使用缓动函数
            const easedT = this.easeOutCubic(t);
            
            // 计算当前位置
            const currentPos = new THREE.Vector3()
                .lerpVectors(startPos, playerPos, easedT);
            
            bombObject.mesh.position.copy(currentPos);
            
            if (t < 1) {
                requestAnimationFrame(animatePull);
            } else {
                // 拉回完成，触发炸弹爆炸
                const bombComponent = bombObject.getComponent('BombComponent');
                if (bombComponent) {
                    bombComponent.onCollision(player);
                }
            }
        };
        
        animatePull();
    }
    
    // 消耗物品
    consumeItem(slotIndex) {
        if (this.slots[slotIndex]) {
            this.slots[slotIndex].count--;
            
            if (this.slots[slotIndex].count <= 0) {
                // 物品数量为0，从物品栏移除
                this.removeItem(slotIndex);
            } else {
                // 更新显示
                this.updateSlotDisplay(slotIndex);
            }
        }
    }
    
    // 缓动函数
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    // 计算网格中心位置
    getGridCenter(screenX, screenY, isHookUsage = false) {
        const GRID_SIZE = 50;
        let gridX = Math.floor((screenX + gameEngine.camera.position.x) / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
        let gridY = Math.floor((screenY + gameEngine.camera.position.y) / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;

        const player = gameEngine.getGameObject('player');
        if (!player) return new THREE.Vector3(gridX, gridY, 0);

        // 计算玩家当前网格位置
        const playerGridX = Math.floor(player.mesh.position.x / GRID_SIZE);
        const playerGridY = Math.floor(player.mesh.position.y / GRID_SIZE);

        // 计算目标网格位置
        const targetGridX = Math.floor(gridX / GRID_SIZE);
        const targetGridY = Math.floor(gridY / GRID_SIZE);

        // 计算网格距离差
        const deltaX = targetGridX - playerGridX;
        const deltaY = targetGridY - playerGridY;
        const distance = Math.hypot(deltaX, deltaY);

        // 如果是钩子使用，不限制距离（钩子有自己的8格范围检查）
        // 如果是普通移动，限制在5格范围内
        const MAX_MOVE_GRIDS = isHookUsage ? 100 : 5; // 钩子使用时给一个很大的值，让钩子自己的范围检查生效
        if (distance > MAX_MOVE_GRIDS && !isHookUsage) {
            // 按方向限制最大移动距离
            const angle = Math.atan2(deltaY, deltaX);
            const adjustedDeltaX = Math.round(MAX_MOVE_GRIDS * Math.cos(angle));
            const adjustedDeltaY = Math.round(MAX_MOVE_GRIDS * Math.sin(angle));

            gridX = (playerGridX + adjustedDeltaX) * GRID_SIZE + GRID_SIZE / 2;
            gridY = (playerGridY + adjustedDeltaY) * GRID_SIZE + GRID_SIZE / 2;
        }

        return new THREE.Vector3(gridX, gridY, 0);
    }
    
    // 添加物品到物品栏
    addItem(item) {
        // 检查是否已经有相同类型的物品
        const existingSlotIndex = this.slots.findIndex(slot => slot && slot.type === item.type);
        if (existingSlotIndex !== -1) {
            // 如果已经有相同类型的物品，增加数量
            this.slots[existingSlotIndex].count += item.count;
            this.updateSlotDisplay(existingSlotIndex);
            console.log(`增加物品 ${item.name} 数量到 ${this.slots[existingSlotIndex].count}`);
            return true;
        } else {
            // 否则添加到空位
            const emptySlotIndex = this.slots.findIndex(slot => slot === null);
            if (emptySlotIndex !== -1) {
                this.slots[emptySlotIndex] = item;
                this.updateSlotDisplay(emptySlotIndex);
                console.log(`添加物品 ${item.name} 到格子 ${emptySlotIndex}`);
                return true;
            }
        }
        return false; // 物品栏已满
    }
    
    // 移除物品
    removeItem(slotIndex) {
        if (this.slots[slotIndex]) {
            const item = this.slots[slotIndex];
            this.slots[slotIndex] = null;
            this.updateSlotDisplay(slotIndex);
            console.log(`移除物品 ${item.name} 从格子 ${slotIndex}`);
            return item;
        }
        return null;
    }
    
    // 更新格子显示
    updateSlotDisplay(slotIndex) {
        const slotElement = document.querySelector(`.inventory-slot[data-slot="${slotIndex}"]`);
        const item = this.slots[slotIndex];
        
        if (item) {
            slotElement.classList.remove('empty');
            const itemIcon = slotElement.querySelector('.item-icon');
            
            // 清空图标内容
            itemIcon.innerHTML = '';
            
            // 根据物品类型设置背景图片
            if (item.type === 'wallhook') {
                itemIcon.style.backgroundImage = 'url("assets/item_wall_hook.png")';
                itemIcon.style.backgroundSize = 'cover';
                itemIcon.style.backgroundPosition = 'center';
                itemIcon.style.backgroundRepeat = 'no-repeat';
            } else if (item.type === 'healthpotion') {
                itemIcon.style.backgroundImage = 'url("assets/item_health_potion.png")';
                itemIcon.style.backgroundSize = 'cover';
                itemIcon.style.backgroundPosition = 'center';
                itemIcon.style.backgroundRepeat = 'no-repeat';
            } else if (item.type === 'mysterybox') {
                itemIcon.style.backgroundImage = 'url("assets/item_box.png")';
                itemIcon.style.backgroundSize = 'cover';
                itemIcon.style.backgroundPosition = 'center';
                itemIcon.style.backgroundRepeat = 'no-repeat';
            } else {
                // 其他物品使用颜色背景
                itemIcon.style.background = item.color || 'rgba(255, 255, 255, 0.3)';
            }
            
            // 更新数量显示（在右上角）
            let countElement = itemIcon.querySelector('.item-count');
            if (!countElement) {
                countElement = document.createElement('div');
                countElement.className = 'item-count';
                itemIcon.appendChild(countElement);
            }
            // 当数量大于等于1时都显示数字
            countElement.textContent = item.count >= 1 ? item.count : '';
            
            // 确保数量显示在右上角
            countElement.style.position = 'absolute';
            countElement.style.top = '-5px';
            countElement.style.right = '-5px';
            countElement.style.background = '#ff4444';
            countElement.style.color = 'white';
            countElement.style.borderRadius = '50%';
            countElement.style.width = '16px';
            countElement.style.height = '16px';
            countElement.style.fontSize = '10px';
            countElement.style.display = 'flex';
            countElement.style.alignItems = 'center';
            countElement.style.justifyContent = 'center';
            countElement.style.fontWeight = 'bold';
        } else {
            slotElement.classList.add('empty');
            const itemIcon = slotElement.querySelector('.item-icon');
            itemIcon.innerHTML = '空';
            itemIcon.style.background = 'rgba(255, 255, 255, 0.1)';
            itemIcon.style.backgroundImage = 'none';
            
            // 移除数量显示
            const countElement = itemIcon.querySelector('.item-count');
            if (countElement) {
                countElement.remove();
            }
        }
    }
    
    // 获取选中的物品
    getSelectedItem() {
        if (this.selectedSlot !== -1) {
            return this.slots[this.selectedSlot];
        }
        return null;
    }

    // 创建提示框元素
    createTooltipElement() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'item-tooltip';
        document.body.appendChild(this.tooltip);
    }

    // 显示物品提示框
    showItemTooltip(event, slotIndex) {
        const item = this.slots[slotIndex];
        if (!item) return;

        // 获取物品描述信息
        const tooltipContent = this.getItemTooltipContent(item);
        this.tooltip.innerHTML = tooltipContent;
        this.tooltip.classList.add('show');

        // 定位提示框
        const slotElement = event.currentTarget;
        const rect = slotElement.getBoundingClientRect();
        
        // 计算位置（在物品上方显示，左边距与物品栏格子对齐）
        const tooltipX = rect.left;
        const tooltipY = rect.top - 10; // 在物品上方10像素
        
        this.tooltip.style.left = `${tooltipX}px`;
        this.tooltip.style.top = `${tooltipY}px`;
        this.tooltip.style.transform = 'translateY(-100%)';
    }

    // 隐藏物品提示框
    hideItemTooltip() {
        this.tooltip.classList.remove('show');
    }

    // 获取物品提示框内容
    getItemTooltipContent(item) {
        switch(item.type) {
            case 'wallhook':
                return '<h4>钩子</h4>' +
                       '<p class="item-description">远程抓取道具的利器</p>' +
                       '<p class="item-effect">效果：右键点击远处的道具将其拉回</p>' +
                       '<p class="item-effect">可抓取：馒头、炸弹、药水、钩子</p>' +
                       '<p class="item-warning">注意：抓取炸弹会立即引爆</p>';
            case 'healthpotion':
                return '<h4>生命药水</h4>' +
                       '<p class="item-description">恢复生命值的珍贵药剂</p>' +
                       '<p class="item-effect">效果：立即恢复 +20 HP</p>' +
                       '<p class="item-effect">稀有度：稀有</p>';
            case 'mysterybox':
                var contentsInfo = '';
                if (item.contents) {
                    contentsInfo = '<p class="item-effect">内容物：' + item.contents.name + ' x' + item.contents.count + '</p>';
                }
                return '<h4>盲盒</h4>' +
                       '<p class="item-description">神秘的惊喜盒子</p>' +
                       '<p class="item-effect">效果：右键使用随机获得道具</p>' +
                       contentsInfo +
                       '<p class="item-effect">可能获得：馒头、生命药水、钩子、神速鞋、炸弹</p>' +
                       '<p class="item-warning">注意：可能获得炸弹，小心使用</p>';
            default:
                return '<h4>' + item.name + '</h4>' +
                       '<p class="item-description">未知物品</p>';
        }
    }
}

// 初始化游戏
const gameEngine = new GameEngine();
const inventorySystem = new InventorySystem();

// 创建玩家
const player = new GameObject(gameEngine, {
    onSpawn: function() {
        // 玩家生成逻辑
    },
    onUpdate: function(deltaTime) {
        // 玩家更新逻辑
    },
    onCollision: function(other) {
        // 玩家碰撞逻辑
    },
    onDestroy: function() {
        // 玩家销毁逻辑
    }
});

player.addComponent('PlayerComponent', new PlayerComponent({
    speed: 5
}));

gameEngine.addGameObject('player', player);
player.spawn();

// 更新馒头数量显示
function updateMTDisplay() {
    const mtValueElement = document.getElementById('mt-value');
    if (mtValueElement) {
        // 计算当前场景中的馒头数量（排除玩家）
        let mantouCount = 0;
        for (const [id, gameObject] of gameEngine.gameObjects) {
            if (id !== 'player' && gameObject.getComponent('MantouComponent')) {
                mantouCount++;
            }
        }
        mtValueElement.textContent = mantouCount;
    }
}

// 创建馒头
function createMantou(position) {
    const mantou = new GameObject(gameEngine, {
        onSpawn: function() {
            updateMTDisplay();
        },
        onCollision: function(other) {
            if (other.getComponent('PlayerComponent')) {
                // 增加玩家HP
                gameEngine.HP += 5;
               
                if (gameEngine.HP > gameEngine.MAX_HP) {
                    gameEngine.HP = gameEngine.MAX_HP;
                }

                gameEngine.totalMantousCollected++;
                
                // 播放获得物品音效
                gameEngine.playGetItemSound();
                
                // 更新HP显示
                const hpDisplay = document.getElementById('hp-value');
                if (hpDisplay) {
                    hpDisplay.textContent = gameEngine.HP;
                }
                
                // 销毁馒头对象
                this.destroy();
            }
        },
        onDestroy: function() {
            updateMTDisplay();
        }
    });
    
    mantou.addComponent('MantouComponent', new MantouComponent({
        lifetime: 20000,
        healAmount: 5
    }));
    
    gameEngine.addGameObject(mantou.id, mantou);
    mantou.spawn();
    
    if (position) {
        mantou.mesh.position.copy(position);
    }
}

// 创建炸弹
function createBomb(position) {
    const bomb = new GameObject(gameEngine, {
        onSpawn: function() {
            // 炸弹生成逻辑
        },
        onCollision: function(other) {
            if (other.getComponent('PlayerComponent')) {
                // 炸弹爆炸逻辑
            }
        },
        onDestroy: function() {
            // 炸弹销毁逻辑
        }
    });
    
    bomb.addComponent('BombComponent', new BombComponent({
        lifetime: 15000,
        damageAmount: 10
    }));
    
    gameEngine.addGameObject(bomb.id, bomb);
    bomb.spawn();
    
    if (position) {
        bomb.mesh.position.copy(position);
    }
}

// 计算屏幕内道具数量
function countItemsInView() {
    const player = gameEngine.getGameObject('player');
    if (!player) return 0;
    
    const viewportWidth = canvas.width;
    const viewportHeight = canvas.height;
    const cameraX = gameEngine.camera.position.x;
    const cameraY = gameEngine.camera.position.y;
    
    let count = 0;
    for (const [id, gameObject] of gameEngine.gameObjects) {
        if (id === 'player') continue;
        
        const objectX = gameObject.mesh.position.x;
        const objectY = gameObject.mesh.position.y;
        
        // 检查对象是否在屏幕范围内
        if (objectX >= cameraX - viewportWidth/2 && objectX <= cameraX + viewportWidth/2 &&
            objectY >= cameraY - viewportHeight/2 && objectY <= cameraY + viewportHeight/2) {
            count++;
        }
    }
    return count;
}

// 馒头生成系统
function startMantouGeneration() {
    const MAX_MT_COUNT = 20;
    const MAX_ITEMS_IN_VIEW = 8; // 屏幕内最多8个道具
    let mantouGenerationInterval;
    
    mantouGenerationInterval = setInterval(() => {
        const itemsInView = countItemsInView();
        if (gameEngine.gameObjects.size < MAX_MT_COUNT + 1 && 
            itemsInView < MAX_ITEMS_IN_VIEW && 
            !gameEngine.isGameOver) {
            setTimeout(() => {
                if (!gameEngine.isGameOver) {
                    generateRandomMantou();
                }
            }, Math.random() * 5000);
        }
    }, 3000);
}

// 炸弹生成系统
function startBombGeneration() {
    const MAX_BOMB_COUNT = 5;
    const MAX_ITEMS_IN_VIEW = 8; // 屏幕内最多8个道具
    let bombGenerationInterval;
    
    bombGenerationInterval = setInterval(() => {
        const itemsInView = countItemsInView();
        if (gameEngine.gameObjects.size < MAX_BOMB_COUNT + 20 + 1 && 
            itemsInView < MAX_ITEMS_IN_VIEW && 
            !gameEngine.isGameOver) {
            setTimeout(() => {
                if (!gameEngine.isGameOver) {
                    generateRandomBomb();
                }
            }, Math.random() * 8000);
        }
    }, 5000);
}

// 钩子生成系统
function startWallHookGeneration() {
    const MAX_WALLHOOK_COUNT = 2; // 钩子生成频率较低
    const MAX_ITEMS_IN_VIEW = 8; // 屏幕内最多8个道具
    let wallHookGenerationInterval;
    
    wallHookGenerationInterval = setInterval(() => {
        const itemsInView = countItemsInView();
        if (gameEngine.gameObjects.size < MAX_WALLHOOK_COUNT + 20 + 5 + 1 && 
            itemsInView < MAX_ITEMS_IN_VIEW && 
            !gameEngine.isGameOver) {
            setTimeout(() => {
                if (!gameEngine.isGameOver) {
                    generateRandomWallHook();
                }
            }, Math.random() * 15000); // 15秒左右的随机延迟
        }
    }, 10000); // 每10秒检查一次
}

// 生命药水生成系统
function startHealthPotionGeneration() {
    const MAX_POTION_COUNT = 1; // 生命药水生成频率很低
    const MAX_ITEMS_IN_VIEW = 8; // 屏幕内最多8个道具
    let potionGenerationInterval;
    
    potionGenerationInterval = setInterval(() => {
        const itemsInView = countItemsInView();
        if (gameEngine.gameObjects.size < MAX_POTION_COUNT + 20 + 5 + 2 + 1 && 
            itemsInView < MAX_ITEMS_IN_VIEW && 
            !gameEngine.isGameOver) {
            setTimeout(() => {
                if (!gameEngine.isGameOver) {
                    generateRandomHealthPotion();
                }
            }, Math.random() * 20000); // 20秒左右的随机延迟
        }
    }, 15000); // 每15秒检查一次
}

// 神速鞋生成系统
function startSpeedShoeGeneration() {
    const MAX_SHOE_COUNT = 1; // 神速鞋生成频率很低
    const MAX_ITEMS_IN_VIEW = 8; // 屏幕内最多8个道具
    let shoeGenerationInterval;
    
    shoeGenerationInterval = setInterval(() => {
        const itemsInView = countItemsInView();
        if (gameEngine.gameObjects.size < MAX_SHOE_COUNT + 20 + 5 + 2 + 1 + 1 && 
            itemsInView < MAX_ITEMS_IN_VIEW && 
            !gameEngine.isGameOver) {
            setTimeout(() => {
                if (!gameEngine.isGameOver) {
                    generateRandomSpeedShoe();
                }
            }, Math.random() * 25000); // 25秒左右的随机延迟
        }
    }, 20000); // 每20秒检查一次
}

// 野牛生成系统
function startWildCowGeneration() {
    const MAX_WILDCOW_COUNT = 3; // 最多3只野牛
    const MAX_ITEMS_IN_VIEW = 8; // 屏幕内最多8个道具
    let wildCowGenerationInterval;
    
    wildCowGenerationInterval = setInterval(() => {
        const itemsInView = countItemsInView();
        if (gameEngine.gameObjects.size < MAX_WILDCOW_COUNT + 20 + 5 + 2 + 1 + 1 + 1 && 
            itemsInView < MAX_ITEMS_IN_VIEW && 
            !gameEngine.isGameOver) {
            setTimeout(() => {
                if (!gameEngine.isGameOver) {
                    generateRandomWildCow();
                }
            }, Math.random() * 20000); // 20秒左右的随机延迟
        }
    }, 15000); // 每15秒检查一次
}

// 盲盒生成系统
function startMysteryBoxGeneration() {
    const MAX_MYSTERYBOX_COUNT = 1; // 盲盒生成频率很低
    const MAX_ITEMS_IN_VIEW = 8; // 屏幕内最多8个道具
    let mysteryBoxGenerationInterval;
    
    mysteryBoxGenerationInterval = setInterval(() => {
        const itemsInView = countItemsInView();
        if (gameEngine.gameObjects.size < MAX_MYSTERYBOX_COUNT + 20 + 5 + 2 + 1 + 1 + 3 && 
            itemsInView < MAX_ITEMS_IN_VIEW && 
            !gameEngine.isGameOver) {
            setTimeout(() => {
                if (!gameEngine.isGameOver) {
                    generateRandomMysteryBox();
                }
            }, Math.random() * 30000); // 30秒左右的随机延迟
        }
    }, 25000); // 每25秒检查一次
}

function generateRandomMysteryBox() {
    const GRID_SIZE = 50;
    const MAX_DISTANCE = 20; // 盲盒可以生成在很远的地方
    const player = gameEngine.getGameObject('player');
    
    if (!player) return;
    
    // 尝试找到空闲的网格位置
    let attempts = 0;
    const maxAttempts = 40;
    
    while (attempts < maxAttempts) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.floor(Math.random() * (MAX_DISTANCE - 10 + 1)) + 10; // 距离玩家10-20格
        const rawX = player.mesh.position.x + Math.round(Math.cos(angle) * distance * GRID_SIZE);
        const rawY = player.mesh.position.y + Math.round(Math.sin(angle) * distance * GRID_SIZE);
        const gridX = Math.floor(rawX / GRID_SIZE);
        const gridY = Math.floor(rawY / GRID_SIZE);
        
        // 检查网格是否被占用（包括玩家位置）
        const existingObject = gameEngine.getGameObjectAtGrid(gridX, gridY);
        if (!existingObject) {
            const positionX = gridX * GRID_SIZE + GRID_SIZE / 2;
            const positionY = gridY * GRID_SIZE + GRID_SIZE / 2;
            createMysteryBox(new THREE.Vector3(positionX, positionY, 0));
            return;
        }
        
        attempts++;
    }
}

// 创建盲盒
function createMysteryBox(position) {
    const mysteryBox = new GameObject(gameEngine, {
        onSpawn: function() {
            // 盲盒生成逻辑
        },
        onCollision: function(other) {
            if (other.getComponent('PlayerComponent')) {
                // 盲盒被拾取逻辑
            }
        },
        onDestroy: function() {
            // 盲盒销毁逻辑
        }
    });
    
    mysteryBox.addComponent('MysteryBoxComponent', new MysteryBoxComponent({
        lifetime: 45000 // 45秒消失
    }));
    
    gameEngine.addGameObject(mysteryBox.id, mysteryBox);
    mysteryBox.spawn();
    
    if (position) {
        mysteryBox.mesh.position.copy(position);
    }
}

function generateRandomHealthPotion() {
    const GRID_SIZE = 50;
    const MAX_DISTANCE = 12; // 生命药水可以生成在中等距离
    const player = gameEngine.getGameObject('player');
    
    if (!player) return;
    
    // 尝试找到空闲的网格位置
    let attempts = 0;
    const maxAttempts = 25;
    
    while (attempts < maxAttempts) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.floor(Math.random() * (MAX_DISTANCE - 6 + 1)) + 6; // 距离玩家6-12格
        const rawX = player.mesh.position.x + Math.round(Math.cos(angle) * distance * GRID_SIZE);
        const rawY = player.mesh.position.y + Math.round(Math.sin(angle) * distance * GRID_SIZE);
        const gridX = Math.floor(rawX / GRID_SIZE);
        const gridY = Math.floor(rawY / GRID_SIZE);
        
        // 检查网格是否被占用（包括玩家位置）
        const existingObject = gameEngine.getGameObjectAtGrid(gridX, gridY);
        if (!existingObject) {
            const positionX = gridX * GRID_SIZE + GRID_SIZE / 2;
            const positionY = gridY * GRID_SIZE + GRID_SIZE / 2;
            createHealthPotion(new THREE.Vector3(positionX, positionY, 0));
            return;
        }
        
        attempts++;
    }
}

// 创建生命药水
function createHealthPotion(position) {
    const healthPotion = new GameObject(gameEngine, {
        onSpawn: function() {
            // 生命药水生成逻辑
        },
        onCollision: function(other) {
            if (other.getComponent('PlayerComponent')) {
                // 生命药水被拾取逻辑
            }
        },
        onDestroy: function() {
            // 生命药水销毁逻辑
        }
    });
    
    healthPotion.addComponent('HealthPotionComponent', new HealthPotionComponent({
        lifetime: 60000 // 60秒消失
    }));
    
    gameEngine.addGameObject(healthPotion.id, healthPotion);
    healthPotion.spawn();
    
    if (position) {
        healthPotion.mesh.position.copy(position);
    }
}

function generateRandomWallHook() {
    const GRID_SIZE = 50;
    const MAX_DISTANCE = 15; // 钩子可以生成在更远的地方
    const player = gameEngine.getGameObject('player');
    
    if (!player) return;
    
    // 尝试找到空闲的网格位置
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.floor(Math.random() * (MAX_DISTANCE - 5 + 1)) + 5; // 距离玩家5-15格
        const rawX = player.mesh.position.x + Math.round(Math.cos(angle) * distance * GRID_SIZE);
        const rawY = player.mesh.position.y + Math.round(Math.sin(angle) * distance * GRID_SIZE);
        const gridX = Math.floor(rawX / GRID_SIZE);
        const gridY = Math.floor(rawY / GRID_SIZE);
        
        // 检查网格是否被占用（包括玩家位置）
        const existingObject = gameEngine.getGameObjectAtGrid(gridX, gridY);
        if (!existingObject) {
            const positionX = gridX * GRID_SIZE + GRID_SIZE / 2;
            const positionY = gridY * GRID_SIZE + GRID_SIZE / 2;
            createWallHook(new THREE.Vector3(positionX, positionY, 0));
            return;
        }
        
        attempts++;
    }
}

// 创建钩子
function createWallHook(position) {
    const wallHook = new GameObject(gameEngine, {
        onSpawn: function() {
            // 钩子生成逻辑
        },
        onCollision: function(other) {
            if (other.getComponent('PlayerComponent')) {
                // 钩子被拾取逻辑
            }
        },
        onDestroy: function() {
            // 钩子销毁逻辑
        }
    });
    
    wallHook.addComponent('WallHookComponent', new WallHookComponent({
        lifetime: 30000 // 30秒消失
    }));
    
    gameEngine.addGameObject(wallHook.id, wallHook);
    wallHook.spawn();
    
    if (position) {
        wallHook.mesh.position.copy(position);
    }
}

function generateRandomBomb() {
    const GRID_SIZE = 50;
    const MAX_DISTANCE = 8;
    const player = gameEngine.getGameObject('player');
    
    if (!player) return;
    
    // 尝试找到空闲的网格位置
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.floor(Math.random() * (MAX_DISTANCE + 1));
        const rawX = player.mesh.position.x + Math.round(Math.cos(angle) * distance * GRID_SIZE);
        const rawY = player.mesh.position.y + Math.round(Math.sin(angle) * distance * GRID_SIZE);
        const gridX = Math.floor(rawX / GRID_SIZE);
        const gridY = Math.floor(rawY / GRID_SIZE);
        
        // 检查网格是否被占用（包括玩家位置）
        const existingObject = gameEngine.getGameObjectAtGrid(gridX, gridY);
        if (!existingObject) {
            const positionX = gridX * GRID_SIZE + GRID_SIZE / 2;
            const positionY = gridY * GRID_SIZE + GRID_SIZE / 2;
            createBomb(new THREE.Vector3(positionX, positionY, 0));
            return;
        }
        
        attempts++;
    }
}

function generateRandomMantou() {
    const GRID_SIZE = 50;
    const MAX_DISTANCE = 10;
    const player = gameEngine.getGameObject('player');
    
    if (!player) return;
    
    // 尝试找到空闲的网格位置
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.floor(Math.random() * (MAX_DISTANCE + 1));
        const rawX = player.mesh.position.x + Math.round(Math.cos(angle) * distance * GRID_SIZE);
        const rawY = player.mesh.position.y + Math.round(Math.sin(angle) * distance * GRID_SIZE);
        const gridX = Math.floor(rawX / GRID_SIZE);
        const gridY = Math.floor(rawY / GRID_SIZE);
        
        // 检查网格是否被占用（包括玩家位置）
        const existingObject = gameEngine.getGameObjectAtGrid(gridX, gridY);
        if (!existingObject) {
            const positionX = gridX * GRID_SIZE + GRID_SIZE / 2;
            const positionY = gridY * GRID_SIZE + GRID_SIZE / 2;
            createMantou(new THREE.Vector3(positionX, positionY, 0));
            return;
        }
        
        attempts++;
    }
}

function generateRandomSpeedShoe() {
    const GRID_SIZE = 50;
    const MAX_DISTANCE = 15; // 神速鞋可以生成在较远的地方
    const player = gameEngine.getGameObject('player');
    
    if (!player) return;
    
    // 尝试找到空闲的网格位置
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.floor(Math.random() * (MAX_DISTANCE - 8 + 1)) + 8; // 距离玩家8-15格
        const rawX = player.mesh.position.x + Math.round(Math.cos(angle) * distance * GRID_SIZE);
        const rawY = player.mesh.position.y + Math.round(Math.sin(angle) * distance * GRID_SIZE);
        const gridX = Math.floor(rawX / GRID_SIZE);
        const gridY = Math.floor(rawY / GRID_SIZE);
        
        // 检查网格是否被占用（包括玩家位置）
        const existingObject = gameEngine.getGameObjectAtGrid(gridX, gridY);
        if (!existingObject) {
            const positionX = gridX * GRID_SIZE + GRID_SIZE / 2;
            const positionY = gridY * GRID_SIZE + GRID_SIZE / 2;
            createSpeedShoe(new THREE.Vector3(positionX, positionY, 0));
            return;
        }
        
        attempts++;
    }
}

// 创建神速鞋
function createSpeedShoe(position) {
    const speedShoe = new GameObject(gameEngine, {
        onSpawn: function() {
            // 神速鞋生成逻辑
        },
        onCollision: function(other) {
            if (other.getComponent('PlayerComponent')) {
                // 神速鞋被拾取逻辑
            }
        },
        onDestroy: function() {
            // 神速鞋销毁逻辑
        }
    });
    
    speedShoe.addComponent('SpeedShoeComponent', new SpeedShoeComponent({
        lifetime: 30000 // 30秒消失
    }));
    
    gameEngine.addGameObject(speedShoe.id, speedShoe);
    speedShoe.spawn();
    
    if (position) {
        speedShoe.mesh.position.copy(position);
    }
}

// 生成随机野牛
function generateRandomWildCow() {
    const GRID_SIZE = 50;
    const MAX_DISTANCE = 20; // 野牛可以生成在较远的地方
    const player = gameEngine.getGameObject('player');
    
    if (!player) return;
    
    // 尝试找到空闲的网格位置
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.floor(Math.random() * (MAX_DISTANCE - 10 + 1)) + 10; // 距离玩家10-20格
        const rawX = player.mesh.position.x + Math.round(Math.cos(angle) * distance * GRID_SIZE);
        const rawY = player.mesh.position.y + Math.round(Math.sin(angle) * distance * GRID_SIZE);
        const gridX = Math.floor(rawX / GRID_SIZE);
        const gridY = Math.floor(rawY / GRID_SIZE);
        
        // 检查网格是否被占用（包括玩家位置）
        const existingObject = gameEngine.getGameObjectAtGrid(gridX, gridY);
        if (!existingObject) {
            const positionX = gridX * GRID_SIZE + GRID_SIZE / 2;
            const positionY = gridY * GRID_SIZE + GRID_SIZE / 2;
            createWildCow(new THREE.Vector3(positionX, positionY, 0));
            return;
        }
        
        attempts++;
    }
}

// 创建野牛
function createWildCow(position) {
    const wildCow = new GameObject(gameEngine, {
        onSpawn: function() {
            // 野牛生成逻辑
        },
        onCollision: function(other) {
            if (other.getComponent('PlayerComponent')) {
                // 野牛碰撞逻辑
            }
        },
        onDestroy: function() {
            // 野牛销毁逻辑
        }
    });
    
    wildCow.addComponent('WildCowComponent', new WildCowComponent({
        health: 100,
        speed: 2,
        moveInterval: 3000,
        moveRadius: 5
    }));
    
    gameEngine.addGameObject(wildCow.id, wildCow);
    wildCow.spawn();
    
    if (position) {
        wildCow.mesh.position.copy(position);
    }
}

// HP更新系统
let hpInterval = setInterval(updateHP, 1000);
function updateHP() {
    if (gameEngine.HP > 0 && !gameEngine.isGameOver) {
        const hpDisplay = document.getElementById('hp-value');
        if (hpDisplay) {
            hpDisplay.textContent = gameEngine.HP;
        }
        
        // 显示HP减少提示
        gameEngine.createFloatingText('-1', '#ff4444');
        gameEngine.HP--;
    }
    if (gameEngine.HP <= 0 && !gameEngine.isGameOver) {
        gameOver();
    }
}

// 游戏结束函数
function gameOver() {
    if (gameEngine.isGameOver) return;
    
    gameEngine.isGameOver = true;
    
    // 播放角色死亡动画
    const player = gameEngine.getGameObject('player');
    if (player && player.getComponent('PlayerComponent')) {
        player.getComponent('PlayerComponent').playDeathAnimation();
    }
    
    // 计算统计数据
    const survivalTime = Math.floor((Date.now() - gameEngine.gameStartTime) / 1000);
    const finalScore = survivalTime + gameEngine.totalMantousCollected * 10;
    
    // 显示统计数据
    const timeValueElement = document.getElementById('time-value');
    const mantousValueElement = document.getElementById('mantous-value');
    const scoreValueElement = document.getElementById('score-value');
    const gameOverElement = document.getElementById('game-over');
    
    if (timeValueElement) timeValueElement.textContent = survivalTime;
    if (mantousValueElement) mantousValueElement.textContent = gameEngine.totalMantousCollected;
    if (scoreValueElement) scoreValueElement.textContent = finalScore;
    if (gameOverElement) gameOverElement.style.display = 'block';
    
    // 停止背景音乐
    gameEngine.stopBackgroundMusic();
    
    // 播放游戏结束前奏音效
    const gameOverPrevSound = new Audio('assets/audios/game_over_prev.mp3');
    gameOverPrevSound.volume = 0.7;
    gameOverPrevSound.play().catch(error => {
        console.log('游戏结束前奏音效播放失败:', error);
    });
    
    // 延迟播放游戏结束音效
    setTimeout(() => {
        gameEngine.playGameOverSound();
    }, 2000); // 2秒后播放主游戏结束音效
    
    // 停止游戏循环
    gameEngine.stop();
    clearInterval(hpInterval);
}

// 鼠标点击移动
function handleMouseDown(event) {
    if (gameEngine.isGameOver) return;
    
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - canvas.width / 2;
    const mouseY = canvas.height / 2 - (event.clientY - rect.top);
    
    // 用户第一次交互时启动背景音乐
    if (!gameEngine.userInteracted) {
        gameEngine.userInteracted = true;
        if (gameEngine.backgroundMusicReady) {
            // 重试播放背景音乐
            gameEngine.backgroundMusic.play().then(() => {
                gameEngine.isBackgroundMusicPlaying = true;
            }).catch(error => {
                console.log('背景音乐重试播放失败:', error);
            });
        } else {
            // 第一次播放背景音乐
            gameEngine.playBackgroundMusic();
        }
    }
    
    if (event.button === 0) {
        // 创建水波纹效果
        const screenX = event.clientX;
        const screenY = event.clientY;
        gameEngine.createRippleEffect(screenX, screenY);
        
        const player = gameEngine.getGameObject('player');
        if (player && player.getComponent('PlayerComponent')) {
            const targetPosition = getGridCenter(mouseX, mouseY);
            player.getComponent('PlayerComponent').moveTo(targetPosition);
        }
    }
}

function getGridCenter(screenX, screenY) {
    const GRID_SIZE = 50;
    let gridX = Math.floor((screenX + gameEngine.camera.position.x) / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
    let gridY = Math.floor((screenY + gameEngine.camera.position.y) / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;

    const player = gameEngine.getGameObject('player');
    if (!player) return new THREE.Vector3(gridX, gridY, 0);

    // 计算玩家当前网格位置
    const playerGridX = Math.floor(player.mesh.position.x / GRID_SIZE);
    const playerGridY = Math.floor(player.mesh.position.y / GRID_SIZE);

    // 计算目标网格位置
    const targetGridX = Math.floor(gridX / GRID_SIZE);
    const targetGridY = Math.floor(gridY / GRID_SIZE);

    // 计算网格距离差
    const deltaX = targetGridX - playerGridX;
    const deltaY = targetGridY - playerGridY;
    const distance = Math.hypot(deltaX, deltaY);

    const MAX_MOVE_GRIDS = 5;
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

// 添加事件监听器
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// 重新开始游戏
const restartBtn = document.getElementById('restart-btn');
if (restartBtn) {
    restartBtn.addEventListener('click', function() {
        // 重新加载页面
        location.reload();
    });
}

// 启动游戏
gameEngine.start();

// 启动馒头生成系统
startMantouGeneration();

// 启动炸弹生成系统
startBombGeneration();

// 启动钩子生成系统
startWallHookGeneration();

// 启动生命药水生成系统
startHealthPotionGeneration();

// 启动神速鞋生成系统
startSpeedShoeGeneration();

// 启动盲盒生成系统
startMysteryBoxGeneration();

// 启动野牛生成系统
startWildCowGeneration();

// 初始生成几个馒头
for (let i = 0; i < 3; i++) {
    setTimeout(() => {
        generateRandomMantou();
    }, i * 2000);
}

// 初始生成几个炸弹
for (let i = 0; i < 2; i++) {
    setTimeout(() => {
        generateRandomBomb();
    }, i * 2000);
}

// 初始生成一个钩子
setTimeout(() => {
    generateRandomWallHook();
}, 5000);

// 初始生成一个神速鞋
setTimeout(() => {
    generateRandomSpeedShoe();
}, 8000);

// 初始生成一个盲盒
setTimeout(() => {
    generateRandomMysteryBox();
}, 10000);

// 初始生成一个野牛
setTimeout(() => {
    generateRandomWildCow();
}, 12000);

// 窗口大小调整
function resizeCanvas() {
    canvas.width = gameArea.clientWidth;
    canvas.height = gameArea.clientHeight;
    gameEngine.renderer.setSize(canvas.width, canvas.height);
    gameEngine.camera.left = canvas.width / -2;
    gameEngine.camera.right = canvas.width / 2;
    gameEngine.camera.top = canvas.height / 2;
    gameEngine.camera.bottom = canvas.height / -2;
    gameEngine.camera.updateProjectionMatrix();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
