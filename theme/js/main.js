
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
        //debugMode: true,
        containerID: "poster-canvas",
    });

    var homePosterData = {
        name: "home",
        type: "svg",
        svgUrl: "theme/img/poster-with-shadow.svg",
        texture: "theme/img/affiche-biennale-ombre.jpg",
        textureCover: true,
        hasToFit: true,

        position: {
            x: 50,
            y: 50,
        },
        size: {
            maxWidth: 66,
            maxHeight: 85,
        },
        angle: -25 // degrees
    };

    var poster = homePhysics.addShape(homePosterData);
});

function onScroll(event){
    var scrollPos = $(document).scrollTop();
    $('#biennale a').each(function () {
        var currLink = $(this);
        var refElement = $(currLink.attr("href"));
        if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
            $('#biennale ul li a').removeClass("active");
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