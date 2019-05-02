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

    this.mouse.element.removeEventListener("mousewheel", this.mouse.mousewheel);
    this.mouse.element.removeEventListener("DOMMouseScroll", this.mouse.mousewheel);

    this.World.add(this.engine.world, mouseConstraint);

    var self = this;
    this.app.ticker.add((delta) => {
        self.Engine.update(self.engine, 16);

        for(var i = 0; i < self.bodies.length; i++) {

            if(self.bodies[i].body && self.bodies[i].graphic) {
                self.bodies[i].graphic.position = self.matterToPixiCoords(self.bodies[i].body.position);
                self.bodies[i].graphic.rotation = self.bodies[i].body.angle/* - self.bodies[i].graphic.initialRotation*/;
            }
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
    this.app.destroy(true);

    this.removeWalls();
}


HomePhysics.prototype.initGraphics = function(params) {
    this.app = new PIXI.Application({
        width: this.boundingRect.width/ this.pixelRatio,
        height: this.boundingRect.height/ this.pixelRatio,
        resolution: this.pixelRatio,
        //backgroundColor: 0xffffff,
        transparent: true,
    });

    //this.graphicContainer = new PIXI.Container();
    //this.app.stage.addChild(this.graphicContainer);

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


    var isScreenBigger =
        this.boundingRect.width * this.boundingRect.height > oldBoundingRect.width * oldBoundingRect.height ?
            true :
            false;

    if(isScreenBigger) {
        this.buildWalls();
    }

    for(var i = 0; i < this.bodies.length; i++) {
        var shape = this.bodies[i];

        this.resizeShape(shape);
    }

    if(!isScreenBigger) {
        this.buildWalls();
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

    // physic object
    if(shape.body) {
        // reset scale
        this.Body.scale(shape.body, 1 / shape.previousScale, 1 / shape.previousScale);
        // apply new scale
        this.Body.scale(shape.body, shape.scale, shape.scale);

        var actualPosition = shape.body.position;
        this.Body.setPosition(shape.body, {x: actualPosition.x * this.worldScale.x, y: actualPosition.y * this.worldScale.y});

        shape.graphicRotation = shape.body.angle;
    }

    // graphic object
    if(shape.graphic) {
        // recreate textures with the right size
        var self = this;
        this.setGraphics(shape, function(graphic) {
            //console.log("graphic resize ready", graphic);
            self.removeGraphics(shape);
            shape.graphic = graphic;
            self.sceneContainer.addChild(shape.graphic);
        });
    }
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
        this.removeGraphics(shape);
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

    if(v) {
        this.Body.scale(v, scaleFactor, scaleFactor);

        vertexSets.push(v);

        this.World.add(this.engine.world, vertexSets);

        shape.body = vertexSets[0];

        shape.body.innerScale = scaleFactor;

        if(options.angle) {
            this.Body.setAngle(shape.body, options.angle);
        }
    }
    else {
        console.warn("Could not create a shape based on the SVG element, probably because it is not made of only 1 path tag.", options);
    }
}


HomePhysics.prototype.setGraphics = function(shape, callback) {
    var options = shape.originalOptions;

    var graphic = new PIXI.Container();

    if(!shape.body) return;

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
        graphic.texture = new PIXI.Sprite.fromImage(options.texture);
        graphic.texture.visible = false;

        // this is needed to correct rotation issues on resize
        if(!shape.graphicRotation) {
            shape.graphicRotation = 0;
        }


        // ugly but working
        var self = this;
        shape.textureImage = new Image();
        shape.textureImage.onload = function() {
            graphic.imgRatio = shape.textureImage.width / shape.textureImage.height;

            if(!options.textureCover) {
                graphic.texture.width = shape.textureImage.width;
                graphic.texture.height = shape.textureImage.height;
            }
            else {
                graphic.texture.width = self.percentToPixel(self.boundingRectRatio.width, shape.scale * 100);
                graphic.texture.height = self.percentToPixel(self.boundingRectRatio.width, shape.scale * 100) / graphic.imgRatio;
            }

            self.setMask(shape, graphic, callback);
        }
        shape.textureImage.src = options.texture;


        graphic.texture.anchor.x = 0.5;
        graphic.texture.anchor.y = 0.5;

        graphic.texture.interactive = true;
        // useless ??
        graphic.texture.on("added", function() {
            //self.bodies.push(self.circle);
        });

        graphic.addChild(graphic.texture);

        graphic.colorSprite = colorSprite;
        graphic.colorSprite.visible = false;

        graphic.colorSprite.rotation = -shape.graphicRotation;

        graphic.addChild(graphic.colorSprite);
    }
    else {
        graphic.texture = colorSprite;
        graphic.addChild(graphic.texture);
    }

    if(options.title) {
        var titleColor = "0x000000";
        if(options.titleColor) {
            titleColor = "0x" + options.titleColor.substring(1)
        }

        var relativeScale = shape.scale / (this.boundingRect.width / this.worldScale.initialScale.width);

        var fontSize = this.boundingRectRatio.width * relativeScale * 0.075;
        //console.log(this.boundingRectRatio.width, relativeScale, fontSize);

        graphic.textStyle = new PIXI.TextStyle({
            fontFamily : 'bzaregular, Arial',
            fontSize: fontSize,
            fontWeight: 700,
            fill : titleColor,
            align : 'center',
        });

        graphic.text = new PIXI.Text(options.title.toUpperCase(), graphic.textStyle);

        // center text
        graphic.text.position.x = -graphic.text.width / 2;
        graphic.text.position.y = -graphic.text.height / 2;

        graphic.text.visible = false;

        graphic.addChild(graphic.text);
    }

    if(options.href) {
        graphic.texture.cursor = 'pointer';

        var pointerCoords = {
            x: 0,
            y: 0,
        };
        graphic.texture.on("mousedown", function(e) {
            pointerCoords.x = e.data.originalEvent.clientX;
            pointerCoords.y = e.data.originalEvent.clientY;
        });

        graphic.texture.on("mouseup", function(e) {
            var newPointerCoords = e.data.global;

            if(Math.abs(pointerCoords.x - newPointerCoords.x) < 20 && Math.abs(pointerCoords.y - newPointerCoords.y) < 20) {
                console.log(">>> should navigate to url", options.href);
            }
        });
    }

    // events
    graphic.texture.on("mouseover", function() {
        //console.log("mouse enter");
        if(graphic.text) graphic.text.visible = true;
        if(graphic.colorSprite && options.href) graphic.colorSprite.visible = true;
    });

    graphic.texture.on("mouseout", function() {
        //console.log("mouse leave");
        if(graphic.text) graphic.text.visible = false;
        if(graphic.colorSprite && options.href) graphic.colorSprite.visible = false;
    });

    if(!options.texture && callback) {
        callback(graphic);
    }
}

HomePhysics.prototype.setMask = function(shape, graphic, callback) {
    var options = shape.originalOptions;

    // create mask
    var mask = new PIXI.Graphics();

    var shapeBodyOffset = {
        x: shape.body.position.x,
        y: shape.body.position.y,
    };

    //var shapeFactor = this.pixelRatio;
    var shapeFactor = 1 / this.pixelRatio;
    if (options.textureCover) {
        /*if (options.size.maxWidth) {
            shapeFactor = shape.graphic.imgRatio;
        }
        else if (options.size.maxHeight) {
            shapeFactor = 1 / shape.graphic.imgRatio;
        }*/
        //console.log(shapeFactor, shape.graphic.imgRatio);

        // set up a big number god knows why it's working
        shapeFactor = 100;
    }

    for (var k = shape.body.parts.length > 1 ? 1 : 0; k < shape.body.parts.length; k++) {
        part = shape.body.parts[k];

        mask.beginFill("0x00ff00"); // arbitrary color, doesn't matter
        mask.moveTo((part.vertices[0].x - shapeBodyOffset.x) * shapeFactor, (part.vertices[0].y - shapeBodyOffset.y) * shapeFactor);
        for (var j = 1; j < part.vertices.length; j++) {
            mask.lineTo((part.vertices[j].x - shapeBodyOffset.x) * shapeFactor, (part.vertices[j].y - shapeBodyOffset.y) * shapeFactor);
        }
        mask.lineTo((part.vertices[0].x - shapeBodyOffset.x) * shapeFactor, (part.vertices[0].y - shapeBodyOffset.y) * shapeFactor);
        mask.endFill();
    }

    mask.rotation = -shape.graphicRotation;

    graphic.texture.mask = mask;
    graphic.texture.addChild(mask);

    graphic.texture.visible = true;

    if(callback) callback(graphic);
}


HomePhysics.prototype.removeGraphics = function(shape) {

    if(shape.graphic.colorSprite) {
        shape.graphic.removeChild(shape.graphic.colorSprite);
    }
    if(shape.graphic.text) {
        shape.graphic.removeChild(shape.graphic.text);
    }
    if(shape.graphic.texture) {
        shape.graphic.removeChild(shape.graphic.texture);

        if(shape.graphic.texture.mask) {
            shape.graphic.removeChild(shape.graphic.texture.mask);
            shape.graphic.texture.mask = null;
        }
    }

    this.sceneContainer.removeChild(shape.graphic);

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
            self.setGraphics(shape, function(graphic) {
                //console.log("graphic ready", graphic);
                shape.graphic = graphic;
                self.sceneContainer.addChild(shape.graphic);
            });

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