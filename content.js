// content.js
// Autonomous Dino player for chromedino.com

(function () {
    "use strict";

    console.log("[Dino AI] Content script loaded.");

    let runner = null;
    let aiRunning = false;
    let lastDuckObstacle = null;

    function findRunner() {
        if (typeof Runner !== "undefined" && Runner.instance_) {
            runner = Runner.instance_;
            console.log("[Dino AI] Runner detected:", runner);
            startAI();
            return;
        }

        setTimeout(findRunner, 100);
    }

    function startAI() {
        if (aiRunning) return;

        aiRunning = true;

        console.log("[Dino AI] Autopilot engaged.");

        requestAnimationFrame(aiLoop);
    }

    function aiLoop() {
        if (!runner) {
            requestAnimationFrame(aiLoop);
            return;
        }

        /*
         * This game does NOT have runner.playing.
         *
         * The supplied game.js uses:
         *   activated
         *   paused
         *   crashed
         */
        if (
            !runner.activated ||
            runner.paused ||
            runner.crashed
        ) {
            requestAnimationFrame(aiLoop);
            return;
        }

        const tRex = runner.tRex;
        const obstacles = runner.horizon.obstacles;

        if (!tRex || !obstacles || obstacles.length === 0) {
            requestAnimationFrame(aiLoop);
            return;
        }

        const obstacle = obstacles[0];

        const speed = runner.currentSpeed;

        /*
         * xPos is the obstacle's position in the game's
         * coordinate system.
         */
        const distance = obstacle.xPos - tRex.xPos;

        const width = obstacle.width || 0;

        /*
         * give ourselves more reaction time as the game
         * becomes faster.
         */
        const reactionDistance = 45 + speed * 8;

        /*
         * Ignore obstacles that have already passed us.
         */
        if (distance <= 0) {
            requestAnimationFrame(aiLoop);
            return;
        }

        /*
         * only react when the obstacle is close enough.
         */
        if (distance <= reactionDistance) {

            const obstacleType =
                obstacle.typeConfig &&
                obstacle.typeConfig.type;

            /*
             * PTERODACTYL
             */
            if (obstacleType === "PTERODACTYL") {

                /*
                 * the game's own code distinguishes pterodactyl
                 * heights using yPos.
                 *
                 * low pterodactyl -> duck.
                 * higher pterodactyl -> jump/ignore depending
                 * on its vertical position.
                 */
                if (obstacle.yPos >= 75) {

                    if (!tRex.jumping && !tRex.ducking) {
                        tRex.setDuck(true);
                        lastDuckObstacle = obstacle;
                    }

                } else {

                    /*
                     * High pterodactyl can be passed by staying
                     * on the ground.
                     */
                }

            } else {

                /*
                 * CACTUS_SMALL / CACTUS_LARGE
                 *
                 * Do not start another jump while already airborne.
                 */
                if (!tRex.jumping && !tRex.ducking) {
                    console.log(
                        "[Dino AI] JUMP",
                        obstacleType,
                        "distance:",
                        distance.toFixed(1),
                        "speed:",
                        speed.toFixed(2)
                    );

                    tRex.startJump(speed);
                }
            }
        }

        /*
         * Release duck after the obstacle has passed.
         */
        if (
            tRex.ducking &&
            lastDuckObstacle &&
            (
                lastDuckObstacle.xPos +
                (lastDuckObstacle.width || 0)
            ) < tRex.xPos
        ) {
            tRex.setDuck(false);
            lastDuckObstacle = null;
        }

        requestAnimationFrame(aiLoop);
    }

    /*
     * Wait until the game's Runner has been created.
     */
    findRunner();

})();