
/*
 * This function displays tooltips and was adapted from original code by Michael Leigeber.
 * See http://www.leigeber.com/
 */
Tooltip = function(useExplicitPositions, tooltipColour)
{
    var top = 3;
    var left = 3;
    var maxw = 300;
    var speed = 10;
    var timer = 20;
    var endalpha = 95;
    var alpha = 0;
    var tt,t,c,b,h;
    var ie = document.all ? true : false;
    
    this.show = function(v,w)
    {
        if (tt == null)
        {
            tt = document.createElement('div');
            tt.style.color = tooltipColour;
            
            tt.style.position = 'absolute';
            tt.style.display =  'block';
            
            t = document.createElement('div');
            
            t.style.display = 'block';
            t.style.height =  '5px';
            t.style.marginleft =  '5px';
            t.style.overflow =  'hidden';
            
            c = document.createElement('div');
            
            b = document.createElement('div');
            
            tt.appendChild(t);
            tt.appendChild(c);
            tt.appendChild(b);
            document.body.appendChild(tt);
            
            if (!ie)
            {
                tt.style.opacity = 0;
                tt.style.filter = 'alpha(opacity=0)';
            }
            else
                tt.style.opacity = 1;
        }
        
        if (!useExplicitPositions)
                document.onmousemove = this.pos;
        
        tt.style.display = 'block';
        c.innerHTML = '<span style="font-weight:bold; font-family: arial;">' + v + '</span>';
        tt.style.width = w ? w + 'px' : 'auto';
        
        if (!w && ie)
        {
            t.style.display = 'none';
            b.style.display = 'none';
            tt.style.width = tt.offsetWidth;
            t.style.display = 'block';
            b.style.display = 'block';
        }
        
        if (tt.offsetWidth > maxw)
        {
            tt.style.width = maxw + 'px';
        }
        
        h = parseInt(tt.offsetHeight) + top;
        
        if (!ie)
        {
            clearInterval(tt.timer);
            tt.timer = setInterval(function(){fade(1)},timer);
        }
    };
    
    this.setPos = function(e)
    {
        tt.style.top = e.y + 'px';
        tt.style.left = e.x + 'px';
    };
    
    this.pos = function(e)
    {
        var u = ie ? event.clientY + document.documentElement.scrollTop : e.pageY;
        var l = ie ? event.clientX + document.documentElement.scrollLeft : e.pageX;
        tt.style.top = (u - h) + 'px';
        tt.style.left = (l + left) + 'px';
        tt.style.zIndex = 999999999999;
    };
    
    function fade(d)
    {
        var a = alpha;
        
        if ((a != endalpha && d == 1) || (a != 0 && d == -1))
        {
            var i = speed;
            
            if (endalpha - a < speed && d == 1)
            {
                i = endalpha - a;
            }
            else if (alpha < speed && d == -1)
            {
                i = a;
            }
        
            alpha = a + (i * d);
            tt.style.opacity = alpha * .01;
            tt.style.filter = 'alpha(opacity=' + alpha + ')';
        } else {
            clearInterval(tt.timer);
            if (d == -1) tt.style.display = 'none';
        }
    }
    
    this.hide = function()
    {
        if (tt == null)
            return;
    
        if (!ie) {
            clearInterval(tt.timer);
            tt.timer = setInterval(function(){fade(-1)},timer);
        } else {
            tt.style.display = 'none';
        }
    };
};
