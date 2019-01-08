const reset = () => confirm('Are you sure?') && (Object.keys(localStorage).map(key => localStorage.removeItem(key)));

(() => {
    onload = () => {
        console.log('onload');

        // method
        const resize = (x, y) => {
            canvas.height = y || innerHeight;
            canvas.width = x || innerWidth;

            height = canvas.height;
            width = canvas.width;
        }

        // initalize
        const output = document.getElementById('output');
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('2d');
        let height = null;
        let width = null;

        // control
        let mouse = {x: -1, y: -1, hover: -1, drag: false, keepX: false, keepY: false};
        let r = 6;

        let keyBuffer = [];
        let logId = 0;
        let log = [];

        output.style.height = `${innerHeight / 2}px`;
        resize(null, innerHeight / 2);

        let position = [
            width / 2 - 100, height / 2 - 50, // pos A (start)
            width / 2 + 100, height / 2 + 50, // pos B (end)
            width / 2 - 70, height / 2, // pos C (cp1)
            width / 2 + 70, height / 2  // pos D (cp2)
        ];

        // check param
        if (location.href.split('?')[1] !== undefined) {
            let param = location.href.split('?')[1].split('=')[1];
            let open = param.split(',');
            let err = false;

            open.length != 8 && (alert('[Parameter is Wrong.]\ninvalid length. It must be 8.'), err = true);

            if (!err) {
                position = [];
                open.map(data => position.push(data));
            }
        }

        // update log
        log.push([]);
        position.map(data => log[log.length - 1].push(data));

        // event
        document.addEventListener('keydown', event => keyBuffer[event.keyCode] = true);

        document.addEventListener('keyup', event => keyBuffer[event.keyCode] = false);

        canvas.addEventListener('mousemove', event => {
            let rect = event.target.getBoundingClientRect();
            let x = event.clientX - rect.left;
            let y = event.clientY - rect.top;

            !keyBuffer[89] && (mouse.x = x);
            !keyBuffer[88] && (mouse.y = y);

            if (mouse.drag) return;

            let stack = null;
            let isOver = false;
            for (let i = 0; i < position.length; i += 2) {
                let targetX = position[i];
                let targetY = position[i + 1];
                if (!isOver && Math.abs(x - targetX) < r * 2 && Math.abs(y - targetY) < r * 2) {
                    stack = i;
                    isOver = true;
                }
            }

            mouse.hover = isOver ? stack : -1;
        });

        canvas.addEventListener('mousedown', () => (!mouse.drag && mouse.hover > -1) && (mouse.drag = true));

        canvas.addEventListener('mouseup', () => {
            if (mouse.drag) {
                mouse.drag = false;

                // add to log
                logId++;
                log.push([]);
                position.map(data => log[log.length - 1].push(data));

                console.log('pos saved');
            }
        });

        // main loop
        (function() {
            // reflesh
            resize(null, 400);
            context.fillStyle = '#00050b';
            context.fillRect(0, 0, width, height);

            // draw bezier
            context.beginPath();
            context.lineWidth = 3;
            confirm.lineCap = 'round';
            context.strokeStyle = 'white';
            context.moveTo(position[0], position[1]);
            context.bezierCurveTo(position[4], position[5], position[6], position[7], position[2], position[3]);
            context.stroke();

            // draw point extension line
            context.lineWidth = 2;
            context.strokeStyle = '#bbb';

            context.beginPath();
            context.moveTo(position[0], position[1]);
            context.lineTo(position[4], position[5]);
            context.stroke();

            context.beginPath();
            context.moveTo(position[2], position[3]);
            context.lineTo(position[6], position[7]);
            context.stroke();

            // draw axis extension line
            context.lineWidth = 1;

            if (keyBuffer[88] && mouse.drag) {
                let y = position[mouse.hover + 1];
                context.strokeStyle = 'red';

                context.beginPath();
                context.moveTo(0, y);
                context.lineTo(width, y);
                context.stroke();
            }

            if (keyBuffer[89] && mouse.drag) {
                let x = position[mouse.hover];
                context.strokeStyle = 'blue';

                context.beginPath();
                context.moveTo(x, 0);
                context.lineTo(x, height);
                context.stroke();
            }

            // draw dot
            for (let i = 0; i < position.length; i += 2) {
                let x = position[i];
                let y = position[i + 1];
                let hover = mouse.hover == i;
                let color = i < 4 ? '#fe1600' : '#00a2fe';

                context.beginPath();
                context.fillStyle = color;
                context.arc(x, y, r + 5 * hover, 0, Math.PI * 2);
                context.fill();

                if (hover && mouse.drag) {
                    position[i] = mouse.x;
                    position[i + 1] = mouse.y;
                }
            }

            if (mouse.hover > -1 || mouse.drag) {
                canvas.style.cursor = 'pointer';
            } else {
                canvas.style.cursor = 'auto';
            }

            if ((keyBuffer[37] || keyBuffer[39]) && log.length > 0) {
                if (keyBuffer[39]) {
                    console.log(logId + 1 <= log.length - 1);
                    if (logId + 1 <= log.length - 1) logId++;
                } else {
                    if (logId > 0) logId--;
                }

                position = [];
                log[logId].map(data => position.push(data));

                keyBuffer[37] = false;
                keyBuffer[39] = false;
            }

            // save
            if (keyBuffer[13]) {
                let normalize = confirm('Do you want normalization positions?');
                let stack = [];

                if (normalize) {
                    position.map((data, id) => {
                        stack.push(data);

                        if (id % 2 == 0) {
                            position[id] /= width;
                        } else {
                            position[id] /= height;
                        }
                    });
                }

                let time = new Date().getTime();
                let name = `data${time}`;

                localStorage.setItem(name, position);
                output.value = `${'-'.repeat(128)}\nsaved at ${time}:\ncontext.moveTo(${position[0]}, ${position[1]});\ncontext.bezierCurveTo(${position[4]}, ${position[5]}, ${position[6]}, ${position[7]}, ${position[2]}, ${position[3]});\ncontext.stroke();\n${output.value}`;

                alert('saved.');

                // restore
                if (normalize) {
                    position = [];
                    stack.map(data => position.push(data));
                }

                keyBuffer[13] = false;
            }

            // reset key bind
            // keyBuffer.fill(0);

            // loop
            requestAnimationFrame(arguments.callee);
        })();
    }
})();