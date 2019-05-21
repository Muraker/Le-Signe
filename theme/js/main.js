
// NAV AutoScroll 'N' ActiveState
$(document).ready(function () {
    $(document).on("scroll", onScroll);

    $('a[href^="#"]').on('click', function (e) {
        e.preventDefault();
        $(document).off("scroll");

        $('a').each(function () {
            $(this).removeClass('active');
        });
        $(this).addClass('active');

        var target = this.hash,
            menu = target;
        $target = $(target);
        $('html, body').stop().animate({
            'scrollTop': $target.offset().top+2
        }, 200, 'swing', function () {
            window.location.hash = target;
            $(document).on("scroll", onScroll);
        });
    });


    // graphic poster physic
    var homePhysics = new HomePhysics({
        //debugMode: true, // uncomment to show original physic objects
        containerID: "poster-canvas", // container where we will append the canvas
    });

    var homePosterData = {
        name: "home",
        type: "svg",
        svgUrl: "theme/img/poster-with-shadow.svg", // svg shape
        texture: "theme/img/affiche-biennale-shadow.png", // texture
        textureCover: true, // if the texture should cover the whole svg shape

        position: {
            x: 50, // percent of the container
            y: 50, // percent of the container
        },
        size: {
            maxWidth: 60, // percent of the container
            maxHeight: 75, // percent of the container
        },
        hasToFit: true, // if true the object will use the min possible size defined by maxWidth and maxHeight, if false it will use the max possible size

        angle: -25 // rotation in degrees
    };
    var poster = homePhysics.addShape(homePosterData);

    var homeLogoData = {
        name: "logo",
        type: "svg",
        svgUrl: "theme/img/sb-path.svg", // svg shape
        texture: "theme/img/sb.png", // texture
        textureCover: true, // if the texture should cover the whole svg shape

        position: {
            x: 10, // percent of the container
            y: 50, // percent of the container
        },
        size: {
            maxWidth: 25, // percent of the container
            maxHeight: 15, // percent of the container
        },
        hasToFit: true, // if true the object will use the min possible size defined by maxWidth and maxHeight, if false it will use the max possible size

        angle: 25 // rotation in degrees
    };
    var logo = homePhysics.addShape(homeLogoData);

    var homePastille01Data = {
        name: "pastille1",
        type: "svg",
        svgUrl: "theme/img/pastille.svg", // svg shape
        texture: "theme/img/pastille.png", // texture
        textureCover: false, // if the texture should cover the whole svg shape

        position: {
            x: 10, // percent of the container
            y: 5, // percent of the container
        },
        size: {
            maxWidth: 4, // percent of the container
            maxHeight: 4, // percent of the container
        },
        hasToFit: true, // if true the object will use the min possible size defined by maxWidth and maxHeight, if false it will use the max possible size

        angle: 0 // rotation in degrees
    };
    var pastille1 = homePhysics.addShape(homePastille01Data);

    var homePastille02Data = {
        name: "pastille2",
        type: "svg",
        svgUrl: "theme/img/pastille.svg", // svg shape
        texture: "theme/img/pastille.png", // texture
        textureCover: false, // if the texture should cover the whole svg shape

        position: {
            x: 20, // percent of the container
            y: 20, // percent of the container
        },
        size: {
            maxWidth: 4, // percent of the container
            maxHeight: 4, // percent of the container
        },
        hasToFit: true, // if true the object will use the min possible size defined by maxWidth and maxHeight, if false it will use the max possible size

        angle: 0 // rotation in degrees
    };
    var pastille2 = homePhysics.addShape(homePastille02Data);

    var homePastille03Data = {
        name: "pastille3",
        type: "svg",
        svgUrl: "theme/img/pastille.svg", // svg shape
        texture: "theme/img/pastille.png", // texture
        textureCover: false, // if the texture should cover the whole svg shape

        position: {
            x: 30, // percent of the container
            y: 0, // percent of the container
        },
        size: {
            maxWidth: 4, // percent of the container
            maxHeight: 4, // percent of the container
        },
        hasToFit: true, // if true the object will use the min possible size defined by maxWidth and maxHeight, if false it will use the max possible size

        angle: 0 // rotation in degrees
    };
    var pastille3 = homePhysics.addShape(homePastille03Data);

    var homePastille04Data = {
        name: "pastille4",
        type: "svg",
        svgUrl: "theme/img/pastille.svg", // svg shape
        texture: "theme/img/pastille.png", // texture
        textureCover: false, // if the texture should cover the whole svg shape

        position: {
            x: 60, // percent of the container
            y: 90, // percent of the container
        },
        size: {
            maxWidth: 4, // percent of the container
            maxHeight: 4, // percent of the container
        },
        hasToFit: true, // if true the object will use the min possible size defined by maxWidth and maxHeight, if false it will use the max possible size

        angle: 0 // rotation in degrees
    };
    var pastille4 = homePhysics.addShape(homePastille04Data);

    var homePastille05Data = {
        name: "pastille5",
        type: "svg",
        svgUrl: "theme/img/pastille.svg", // svg shape
        texture: "theme/img/pastille.png", // texture
        textureCover: false, // if the texture should cover the whole svg shape

        position: {
            x: 70, // percent of the container
            y: 10, // percent of the container
        },
        size: {
            maxWidth: 4, // percent of the container
            maxHeight: 4, // percent of the container
        },
        hasToFit: true, // if true the object will use the min possible size defined by maxWidth and maxHeight, if false it will use the max possible size

        angle: 0 // rotation in degrees
    };
    var pastille5 = homePhysics.addShape(homePastille05Data);
});

function onScroll(event){
    var scrollPos = $(document).scrollTop();
    $('#biennale a.link').each(function () {
        var currLink = $(this);
        var refElement = $(currLink.attr("href"));
        if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
            $('#biennale ul li a.link').removeClass("active");
            currLink.addClass("active");
        }
        else{
            currLink.removeClass("active");
        }
    });
}



// MENU Up 'N' Close
var prevScrollpos = window.pageYOffset;
window.onscroll = function() {
    var currentScrollPos = window.pageYOffset;
    if (prevScrollpos > currentScrollPos) {
        document.getElementById("biennale").style.top = "0";
    } else {
        document.getElementById("biennale").style.top = "-200px";
    }
    prevScrollpos = currentScrollPos;
};
