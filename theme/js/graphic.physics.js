// Constructor function
function HomePhysics(params) {
    this.init(params);
}


HomePhysics.prototype.init = function(params) {
    var parameters = params || {};

    this.pixelRatio = window.devicePixelRatio || 1;

    this.canvasContainer = document.getElementById(parameters.containerID || "canvas");
    this.boundingRect = this.canvasContainer.getBoundingClientRect();

    this.boundingRectRatio = {
        width: this.boundingRect.width / this.pixelRatio,
        height: this.boundingRect.height / this.pixelRatio,
    };

    this.worldScale = {
        x: 1,
        y: 1,
        initialScale: {
            width: this.boundingRect.width,
            height: this.boundingRect.height,
        }
    };

    this.debugMode = parameters.debugMode || false;

    this.initPhysics();
    this.initGraphics();


    // create walls
    this.buildWalls();

    // this will handle all our bodies
    this.bodies = [];

    // add mouse control
    this.mouse = this.Mouse.create(this.app.renderer.view),
        mouseConstraint = this.MouseConstraint.create(this.engine, {
            mouse: this.mouse,
            constraint: {
                stiffness: 0.1,
                render: {
                    visible: false
                }
            }
        });

    this.World.add(this.engine.world, mouseConstraint);


    var self = this;
    this.app.ticker.add((delta) => {
        self.Engine.update(self.engine, 16);

        for(var i = 0; i < self.bodies.length; i++) {

            self.bodies[i].graphic.position = self.matterToPixiCoords(self.bodies[i].body.position);
            self.bodies[i].graphic.rotation = self.bodies[i].body.angle;
        }

        TWEEN.update();
    });

    // handle resize
    this.resizeHandler = self.resize.bind(self);
    window.addEventListener("resize", self.resizeHandler, true);
};


HomePhysics.prototype.clear = function() {
    // remove resize handler
    var self = this;
    window.removeEventListener("resize", self.resizeHandler, true);

    for(var i = 0; i < this.bodies.length; i++) {
        this.removeShape(this.bodies[i]);
    }

    this.app.stage.removeChild(this.sceneContainer);
    this.app.destroy();

    this.removeWalls();
}


HomePhysics.prototype.initGraphics = function(params) {
    this.app = new PIXI.Application({
        width: this.boundingRect.width/ this.pixelRatio,
        height: this.boundingRect.height/ this.pixelRatio,
        resolution: this.pixelRatio,
        transparent: true,
    });

    this.canvasContainer.appendChild(this.app.view);

    this.sceneContainer = new PIXI.Container();
    this.sceneContainer.width = this.app.screen.width ;
    this.sceneContainer.height = this.app.screen.height;
    this.sceneContainer.x = this.app.screen.width / 2;
    this.sceneContainer.y = this.app.screen.height / 2;

    this.app.stage.addChild(this.sceneContainer);

    if(this.debugMode) {
        this.app.renderer.view.setAttribute("data-lib", "PIXI");
    }
}


HomePhysics.prototype.initPhysics = function(params) {
    // module aliases
    this.Engine = Matter.Engine;
    this.Render = Matter.Render; // USELESS ?
    this.Runner = Matter.Runner;
    this.World = Matter.World;

    this.Composite = Matter.Composite;
    this.Events = Matter.Events;
    this.Constraint = Matter.Constraint;
    this.MouseConstraint = Matter.MouseConstraint;
    this.Mouse = Matter.Mouse;

    this.Events = Matter.Events;
    this.Query = Matter.Query;

    this.Svg = Matter.Svg;
    this.Common = Matter.Common;
    this.Vertices = Matter.Vertices;

    this.Body = Matter.Body;
    this.Bodies = Matter.Bodies;


    // create an engine
    this.engine = this.Engine.create();

    this.engine.world.bounds.max.x = this.boundingRect.width;
    this.engine.world.bounds.max.y = this.boundingRect.height;

    if(this.debugMode) {
        this.render = this.Render.create({
            element: this.canvasContainer,
            engine: this.engine,
            options: {
                width: this.boundingRect.width,
                height: this.boundingRect.height,
                wireframes: false,
                background: "#ffffff"
            }
        });

        this.Render.run(this.render);

        this.render.canvas.setAttribute("data-lib", "Matter");
    }

    // create runner
    this.runner = this.Runner.create();
    this.Runner.run(this.runner, this.engine);

    this.Engine.run(this.engine);
}


HomePhysics.prototype.resize = function() {
    var oldBoundingRect = this.boundingRect;

    this.boundingRect = this.canvasContainer.getBoundingClientRect();

    this.pixelRatio = window.devicePixelRatio || 1;

    this.boundingRectRatio = {
        width: this.boundingRect.width / this.pixelRatio,
        height: this.boundingRect.height / this.pixelRatio,
    };


    this.worldScale.x = this.boundingRect.width / oldBoundingRect.width;
    this.worldScale.y = this.boundingRect.height / oldBoundingRect.height;

    // graphics
    this.app.renderer.resize(this.boundingRect.width / this.pixelRatio, this.boundingRect.height / this.pixelRatio);

    this.sceneContainer.width = this.boundingRect.width / this.pixelRatio;
    this.sceneContainer.height = this.boundingRect.height / this.pixelRatio;
    this.sceneContainer.x = this.boundingRect.width / (2 * this.pixelRatio);
    this.sceneContainer.y = this.boundingRect.height / (2 * this.pixelRatio);
    this.sceneContainer.scale.x = 1;
    this.sceneContainer.scale.y = 1;

    // physics
    if(this.debugMode) {
        this.render.canvas.width = this.boundingRect.width;
        this.render.canvas.height = this.boundingRect.height;
    }

    this.engine.world.bounds.max.x = this.boundingRect.width;
    this.engine.world.bounds.max.y = this.boundingRect.height;


    this.buildWalls();


    for(var i = 0; i < this.bodies.length; i++) {
        var shape = this.bodies[i];

        this.resizeShape(shape);
    }
}


HomePhysics.prototype.setScale = function(shape) {
    var options = shape.originalOptions;
    shape.previousScale = shape.scale;

    var maxHeight = (options.size.maxHeight / 100) || 0.75;
    var maxWidth = (options.size.maxWidth / 100) || 0.75;

    var width = maxWidth;
    var widthToHeight = maxHeight * this.boundingRectRatio.height * (options.svgSize.width / options.svgSize.height) / this.boundingRectRatio.width;

    if(!options.hasToFit) {
        shape.scale = Math.max(width, widthToHeight);
    }
    else {
        shape.scale = Math.min(width, widthToHeight);
    }

    // readjust based on initial width
    shape.scale *= this.boundingRect.width / this.worldScale.initialScale.width;
}


HomePhysics.prototype.resizeShape = function(shape) {
    this.setScale(shape);

    var options = shape.originalOptions;

    // reset scale
    this.Body.scale(shape.body, 1 / shape.previousScale, 1 / shape.previousScale);
    // apply new scale
    this.Body.scale(shape.body, shape.scale, shape.scale);


    var actualPosition = shape.body.position;
    this.Body.setPosition(shape.body, {x: actualPosition.x * this.worldScale.x, y: actualPosition.y * this.worldScale.y});

    // resize textures
    if(options.type == "svg") {
        // reset scale
        shape.graphic.scale.x *= 1 / (shape.previousScale * this.pixelRatio);
        shape.graphic.scale.y *= 1 / (shape.previousScale * this.pixelRatio);
        // apply new scale
        shape.graphic.scale.x *= shape.scale * this.pixelRatio;
        shape.graphic.scale.y *= shape.scale * this.pixelRatio;
    }

    // handle resize rotation bug
    //shape.graphic.initialRotation = shape.body.angle;
}


HomePhysics.prototype.percentToPixel = function(referential, percentage) {
    return referential * percentage / 100;
}


HomePhysics.prototype.matterToPixiCoords = function(coords) {
    var pixiCoords = {
        x: (coords.x / this.pixelRatio) - this.boundingRect.width / (2 * this.pixelRatio),
        y: (coords.y / this.pixelRatio) - this.boundingRect.height / (2 * this.pixelRatio),
    }
    return pixiCoords;
}


HomePhysics.prototype.addShape = function(options) {

    var shape = {};

    if(!options) {
        options = {
            type: "rectangle",

            fillStyle: "#ff0000",
            originalFillStyle: "#ff0000",
            strokeStyle: "transparent",
            position: {
                x: 0,
                y: 0,
            },
            size: {
                maxWidth: this.percentToPixel(this.boundingRectRatio.width, 12.5),
                maxHeight: this.percentToPixel(this.boundingRectRatio.width, 12.5),
            }
        };
    }
    else {
        if(!options.type) {
            options.type= "rectangle";
        }

        if(!options.position) {
            options.position = {
                x: 0,
                y: 0,
            };
        }

        if(!options.size) {
            options.position = {
                maxWidth: this.percentToPixel(this.boundingRectRatio.width, 12.5),
                maxHeight: this.percentToPixel(this.boundingRect.width, 12.5),
            };
        }

        if(!options.fillStyle) {
            options.fillStyle = "#ff0000";
        }

        if(!options.strokeStyle) {
            options.strokeStyle = "transparent";
        }
    }


    var renderOptions = {
        fillStyle: options.fillStyle,
        originalFillStyle: options.fillStyle,
        strokeStyle: options.strokeStyle,
    };

    if(options.texture) {
        renderOptions.sprite = {
            texture: options.texture,
            xScale: 1,
            yScale: 1,
        };
    }

    if(options.type == "svg" && options.svgUrl) {
        shape = this.loadSVGShape(options);
    }
    else {
        console.warn("You should define a svgUrl to load the shape");
    }

    return shape;

}

HomePhysics.prototype.removeShape = function(shape) {

    if(shape.graphic) {

        if(shape.graphic.mask) {
            shape.graphic.removeChild(shape.graphic.mask);
            shape.graphic.mask = null;
        }

        this.sceneContainer.removeChild(shape.graphic);
    }

    if(shape.body) {
        this.Composite.remove(this.engine.world, shape.body);
    }

    shape = {};

}


HomePhysics.prototype.setPhysicBody = function(svg, shape) {

    var svgViewBox = svg.getAttribute("viewBox").split(" ");

    var svgSize = {
        width: svgViewBox[2] || svg.width.baseVal.value || 100,
        height: svgViewBox[3] || svg.height.baseVal.value || 100,
    }

    shape.originalOptions.svgSize = svgSize;

    var paths = svg.getElementsByTagName("path");
    var vertexSets = [];

    var options = shape.originalOptions;

    //shape.scale = 1;

    this.setScale(shape);

    // calculate shape real size on screen based on its scale, width of the screen and svg element width
    var scaleFactor = shape.scale * this.boundingRect.width / svgSize.width;

    // TODO is this needed ??
    for(var i = 0; i < paths.length; i++) {

        var pathToVertices = this.Svg.pathToVertices(paths[i], 2);



        /*var segmentsList = paths[0].getPathData({normalize: true});
        var pointsArray = [];
        for (var i = 0; i < segmentsList.length; i++) {
            if(segmentsList[i].values.length > 0) {
                pointsArray.push(segmentsList[i].values.map(function(x) { return x * scaleFactor; }));
            }
        }*/
    }

    // used only for debug
    var renderOptions = {
        fillStyle: "#00ff00",
        originalFillStyle: "transparent",
        strokeStyle: "transparent",
    };

    var v = this.Bodies.fromVertices(
        this.percentToPixel(this.boundingRect.width, options.position.x),
        this.percentToPixel(this.boundingRect.height, options.position.y),
        pathToVertices, {
            render: renderOptions
        }, true);

    v && this.Body.scale(v, scaleFactor, scaleFactor);

    vertexSets.push(v);

    this.World.add(this.engine.world, vertexSets);

    shape.body = vertexSets[0];

    shape.body.innerScale = scaleFactor;

    if(options.angle) {
        this.Body.setAngle(shape.body, options.angle);
    }
}


HomePhysics.prototype.setGraphics = function(shape) {
    var options = shape.originalOptions;


    var colorSprite = new PIXI.Graphics();

    for (var k = shape.body.parts.length > 1 ? 1 : 0; k < shape.body.parts.length; k++) {
        part = shape.body.parts[k];

        colorSprite.beginFill("0x" + options.fillStyle.substring(1));
        colorSprite.moveTo((part.vertices[0].x - shape.body.position.x) / this.pixelRatio, (part.vertices[0].y - shape.body.position.y) / this.pixelRatio);
        for (var j = 1; j < part.vertices.length; j++) {
            colorSprite.lineTo((part.vertices[j].x - shape.body.position.x) / this.pixelRatio , (part.vertices[j].y - shape.body.position.y) / this.pixelRatio);
        }
        colorSprite.lineTo((part.vertices[0].x - shape.body.position.x) / this.pixelRatio, (part.vertices[0].y - shape.body.position.y) / this.pixelRatio);
        colorSprite.endFill();
    }


    if(options.texture) {
        shape.graphic = new PIXI.Sprite.fromImage(options.texture);
        shape.graphic.visible = false;

        // ugly but working
        var self = this;
        var image = new Image();
        image.onload = function() {
            shape.graphic.imgRatio = image.width / image.height;

            if(!options.textureCover) {
                shape.graphic.width = image.width;
                shape.graphic.height = image.height;
            }
            else {
                shape.graphic.width = self.percentToPixel(self.boundingRectRatio.width, shape.scale * 100);
                shape.graphic.height = self.percentToPixel(self.boundingRectRatio.width, shape.scale * 100) / shape.graphic.imgRatio;
            }

            self.setMask(shape);
        }
        image.src = options.texture;


        shape.graphic.anchor.x = 0.5;
        shape.graphic.anchor.y = 0.5;

        shape.graphic.interactive = true;
        // useless ??
        shape.graphic.on("added", function() {
            //self.bodies.push(self.circle);
        });

        shape.graphic.colorSprite = colorSprite;
        shape.graphic.colorSprite.visible = false;
        shape.graphic.addChild(shape.graphic.colorSprite);
    }
    else {
        shape.graphic = colorSprite;
    }

    if(options.title) {
        var titleColor = "0x000000";
        if(options.titleColor) {
            titleColor = "0x" + options.titleColor.substring(1)
        }

        var fontSize = this.boundingRectRatio.width * shape.scale * 0.075;

        shape.graphic.text = new PIXI.Text(options.title.toUpperCase(), {
            fontFamily : 'bzaregular, Arial',
            fontSize: fontSize,
            fontWeight: 700,
            fill : titleColor,
            align : 'center',
        });

        // center text
        shape.graphic.text.position.x = -shape.graphic.text.width / 2;
        shape.graphic.text.position.y = -shape.graphic.text.height / 2;

        shape.graphic.text.visible = false;

        shape.graphic.addChild(shape.graphic.text);
    }

    if(options.href) {
        shape.graphic.cursor = 'pointer';

        var pointerCoords = {
            x: 0,
            y: 0,
        };
        shape.graphic.on("mousedown", function(e) {
            pointerCoords.x = e.data.originalEvent.clientX;
            pointerCoords.y = e.data.originalEvent.clientY;
        });

        shape.graphic.on("mouseup", function(e) {
            var newPointerCoords = e.data.global;

            if(Math.abs(pointerCoords.x - newPointerCoords.x) < 20 && Math.abs(pointerCoords.y - newPointerCoords.y) < 20) {
                console.log(">>> should navigate to url", options.href);
            }
        });
    }

    // events
    shape.graphic.on("mouseover", function() {
        //console.log("mouse enter");
        if(shape.graphic.text) shape.graphic.text.visible = true;
        if(shape.graphic.colorSprite && options.href) shape.graphic.colorSprite.visible = true;
    });

    shape.graphic.on("mouseout", function() {
        //console.log("mouse leave");
        if(shape.graphic.text) shape.graphic.text.visible = false;
        if(shape.graphic.colorSprite && options.href) shape.graphic.colorSprite.visible = false;
    });

    // this is nedded to correct rotation issues on resize
    //shape.graphic.initialRotation = 0;

    this.sceneContainer.addChild(shape.graphic);
}

HomePhysics.prototype.setMask = function(shape) {
    var options = shape.originalOptions;

    // create mask
    shape.mask = new PIXI.Graphics();

    var shapeBodyOffset = {
        x: shape.body.position.x,
        y: shape.body.position.y,
    };

    //var shapeFactor = this.pixelRatio;
    var shapeFactor = 1 / this.pixelRatio;
    if (options.textureCover) {
        // set up a big number god knows why it's working
        shapeFactor = 100;
    }

    for (var k = shape.body.parts.length > 1 ? 1 : 0; k < shape.body.parts.length; k++) {
        part = shape.body.parts[k];

        shape.mask.beginFill("0x00ff00"); // arbitrary color, doesn't matter
        shape.mask.moveTo((part.vertices[0].x - shapeBodyOffset.x) * shapeFactor, (part.vertices[0].y - shapeBodyOffset.y) * shapeFactor);
        for (var j = 1; j < part.vertices.length; j++) {
            shape.mask.lineTo((part.vertices[j].x - shapeBodyOffset.x) * shapeFactor, (part.vertices[j].y - shapeBodyOffset.y) * shapeFactor);
        }
        shape.mask.lineTo((part.vertices[0].x - shapeBodyOffset.x) * shapeFactor, (part.vertices[0].y - shapeBodyOffset.y) * shapeFactor);
        shape.mask.endFill();
    }


    shape.graphic.mask = shape.mask;
    shape.graphic.addChild(shape.mask);

    shape.graphic.visible = true;
}

HomePhysics.prototype.loadSVGShape = function(options) {
    var xhr = new XMLHttpRequest();

    var self = this;

    var shape = {
        scale: 1,
        previousScale: 1,
    };

    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 0)) {

            var svg = xhr.responseXML.documentElement;

            shape.originalOptions = options;

            self.setPhysicBody(svg, shape);

            // now texture it
            self.setGraphics(shape);

            self.bodies.push(shape);

            return shape;
        }
        else if(xhr.status == 404) {
            console.warn("SVG couldn't be loaded, shape has not been created", options);
            return false;
        }
    };

    xhr.open("GET", options.svgUrl, true);

    // Following line is just to be on the safe side;
    // not needed if your server delivers SVG with correct MIME type
    xhr.overrideMimeType("image/svg+xml");

    xhr.send(null);
}


HomePhysics.prototype.buildWalls = function(options) {

    const WALL_THICKNESS = 80;

    if(this.walls) {

        this.Body.scale(this.walls.ground, this.worldScale.x, 1);
        this.Body.setPosition(this.walls.ground, {x: this.boundingRect.width / 2, y: this.boundingRect.height + WALL_THICKNESS / 2});

        this.Body.scale(this.walls.leftWall, 1, this.worldScale.y);
        this.Body.setPosition(this.walls.leftWall, {x: -WALL_THICKNESS / 2, y: this.boundingRect.height / 2});

        this.Body.scale(this.walls.rightWall, 1, this.worldScale.y);
        this.Body.setPosition(this.walls.rightWall, {x: this.boundingRect.width + WALL_THICKNESS / 2, y: this.boundingRect.height / 2});

        this.Body.scale(this.walls.ceiling, this.worldScale.x, 1);
        this.Body.setPosition(this.walls.ceiling, {x: this.boundingRect.width / 2, y: -WALL_THICKNESS / 2});
    }
    else {
        this.walls = {};

        this.walls.ground = this.Bodies.rectangle(this.boundingRect.width / 2, this.boundingRect.height + WALL_THICKNESS / 2, this.boundingRect.width, WALL_THICKNESS, { isStatic: true, render: {visible: false} });

        this.walls.leftWall = this.Bodies.rectangle(-WALL_THICKNESS / 2, this.boundingRect.height / 2, WALL_THICKNESS, this.boundingRect.height, { isStatic: true, render: {visible: false} });


        this.walls.rightWall = this.Bodies.rectangle(this.boundingRect.width + WALL_THICKNESS / 2, this.boundingRect.height / 2, WALL_THICKNESS, this.boundingRect.height, { isStatic: true, render: {visible: false} });

        this.walls.ceiling = this.Bodies.rectangle(this.boundingRect.width / 2, -WALL_THICKNESS / 2, this.boundingRect.width, WALL_THICKNESS, { isStatic: true, render: {visible: false} });

        // add all of the bodies to the world
        this.World.add(this.engine.world, [this.walls.ground, this.walls.leftWall, this.walls.rightWall, this.walls.ceiling]);
    }

}

HomePhysics.prototype.removeWalls = function() {
    if(this.walls) {
        this.Composite.remove(this.engine.world, this.walls.ground);
        this.Composite.remove(this.engine.world, this.walls.leftWall);
        this.Composite.remove(this.engine.world, this.walls.rightWall);
        this.Composite.remove(this.engine.world, this.walls.ceiling);

        this.walls = {};
    }
}