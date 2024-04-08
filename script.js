//toolbox icons
const icons = "./assets/icons.png";

//default values
let line_size = 1;
let color = "#000";
let font_size = 12;
let image_size = {w: 400, h: 300};
let canvas = undefined;

//temp line
let this_line = {};

//drew lines
let lines = [
    // {
    //     p: [
    //         {
    //             f: {x: 0, y: 0},
    //             t: {x: 0, y: 0},
    //         }
    //     ], //paths
    //     s: 0, //line size
    //     c: '#000' //color
    // },
];
//deleted lines
let deleted_lines = [
    // {
    //     p: [
    //         {
    //             f: {x: 0, y: 0},
    //             t: {x: 0, y: 0},
    //         }
    //     ], //paths
    //     s: 0, //line size
    //     c: '#000' //color
    // },
];
//is current path is completed drawing
let is_path_done = false;

//initialize default values
const initDefault = ()=>{
    //window size
    setMainWindowSize();
    
    //toolbox
    populateToolbox();
    
    //line size
    $("#line-size").val(line_size);
    //line color
    $('#color').css('background-color', color);
    //image size
    $('#image-size-x').val(image_size.w);
    $('#image-size-y').val(image_size.h);
    updateImageSize();
}

//set window width and height to the size of browser
const setMainWindowSize = ()=>{
    let w = window.innerWidth;
    let h = window.innerHeight;

    $('.container').css({
        'min-width': w * 0.9,
        'min-height': h * 0.9,
    });
}

//set image (draw area) size
const updateImageSize = ()=>{
    //backup canvas data before updating size
    let data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

    //get new size from input fields
    let w = $('#image-size-x').val();
    let h = $('#image-size-y').val();
    
    //update canvas
    canvas.width = w;
    canvas.height = h;
    
    //update size
    image_size.w = w;
    image_size.h = h;

    //restore canvas after updating data
    canvas.getContext('2d').putImageData(data, 0, 0)
}

//calculate button position compare to its container
const calButtonHeight = (button_id)=>{
    let btn = document.getElementById(button_id);
    let btnRect = btn.getBoundingClientRect();
    let containerRect = btn.parentElement.getBoundingClientRect();
    
    return btnRect.top - containerRect.top + 10;
}

//show tooltip on mouse over
const showTooltip = (parent_id, message, y)=>{
    
    //init element
    if(!$('.toolbox')[0].contains( $('.tooltip-message')[0] )){
        let tooltip = `<div class="tooltip-message">${message}</div>`;
        $('.toolbox').append(tooltip)
    }

    let x = $(`#${parent_id}`).css('width');

    $('.tooltip-message').css({
        'top': y,
        'left': x
    })
}

//destroy tooltip
const destroyTooltip = ()=>{
    if($('.toolbox')[0].contains( $('.tooltip-message')[0] )) {
        $('.tooltip-message')[0].remove();  
    }
}

//make toolbox icons work
const populateToolbox = ()=>{
    let list = ['undo', 'redo', 'save'];
    // let list = ['undo', 'redo', 'pen', 'eraser', 'save'];
    
    $(".toolbox-icon").on('mouseover', function(e){
        //highlight icon 
        $(e.target).css({ opacity: 1 });

        for (let i = 0; i < list.length; ++i) {
            let target_id = $(e.target).attr('id');
            
            if(target_id === list[i]){
                let tooltip_y = calButtonHeight(target_id)
                showTooltip(target_id, list[i], tooltip_y)
            }
        }
        
        //
        $(e.target).on('mouseout', function(){
            $(e.target).css({ opacity: 0.6 })
            destroyTooltip()
        })
    })
}

//get cursor tip position
const getCursorPos = (e)=>{
    let canvasRect = canvas.getBoundingClientRect();
    return {x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top}
}

//update line size
const updateLineSize = ()=>{
    line_size = $('#line-size').val();
}

//draw
const draw = (ctx, old_pos, new_pos)=>{
    if(!is_path_done){
        //add path data
        this_line.p.push({
            f: {x: old_pos.x, y: old_pos.y},
            t: {x: new_pos.x, y: new_pos.y},
        })
        
        //draw
        ctx.beginPath();
        ctx.moveTo(old_pos.x, old_pos.y);
        ctx.lineTo(new_pos.x, new_pos.y);
        ctx.lineWidth = this_line.s;
        if(this_line.s >= 4) ctx.lineCap = 'round';
        ctx.stroke();
    }else{
        //if path_is_done === true then add to lines
        lines.push(this_line);
    }
}

//redraw
const redraw = (ctx, this_line, size)=>{
    ctx.beginPath();
    ctx.moveTo(this_line.f.x, this_line.f.y);
    ctx.lineTo(this_line.t.x, this_line.t.y);
    ctx.lineWidth = size;
    if(size >= 4) ctx.lineCap = 'round';
    ctx.stroke();
}

//undo last change
const undo = (ctx)=>{
    //clear canvas
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff'

    //push removed path to deleted_lines
    deleted_lines.push(lines.pop());
    
    //redraw image
    for (let i = 0; i < lines.length; i++) {    //loop through lines
        for (let j = 0; j < lines[i].p.length; j++) {    //loop through pos
            redraw(ctx, lines[i].p[j], lines[i].s)
        }
    }
}

//restore last change
const redo = (ctx)=>{
    //get last deleted path
    let last_deleted = deleted_lines[deleted_lines.length - 1];
    //add back to lines
    lines.push(last_deleted);

    //draw
    for (let i = 0; i < last_deleted.p.length; ++i) {    //loop through pos
        redraw(ctx, last_deleted.p[i], last_deleted.s)
    }
    // pop last element
    deleted_lines.pop();
}

$(function(){
    //get the canvas
    canvas = document.getElementById('draw-canvas');

    initDefault();
    let ctx = canvas.getContext('2d');
    
    //set image background color to white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //handle window resize event
    $(window).on('resize', ()=>{
        //update main window size
        setMainWindowSize();
    });
    
    //draw
    const mouseMoveEvent = (old_pos, new_pos)=>{
        draw(ctx, old_pos, new_pos);
    }
    
    //init old pos
    let old_pos;
    //assign starting point of path
    $('#draw-canvas').on('mousedown', function(e_down){
        //init current line
        this_line = {
            c: color,
            s: Number(line_size),
            p: []
        };

        //mark path is started
        is_path_done = false;
        //get line start pos
        old_pos = getCursorPos(e_down);
    });
    //if mouse is down and old_pos is assigned, draw 
    $('#draw-canvas').on('mousemove', (e_move)=>{
        //if path is ended, cancel this event
        if(is_path_done) return;
        if(old_pos !== undefined){
            //get new cursor pos
            let new_pos = getCursorPos(e_move);
            mouseMoveEvent(old_pos, new_pos);
            // reassign pos
            old_pos = new_pos;
        }
    });
    //mouseup mark path is done
    $('#draw-canvas').on('mouseup', function(){
        is_path_done = true;
        mouseMoveEvent()
        this_line = {};
    })
    
    //undo
    $('#undo').on('click', ()=>{
        if(lines.length > 0) undo(ctx);
    })
    //redo
    $('#redo').on('click', ()=>{
        if(deleted_lines.length > 0) redo(ctx);
    })
    //save
    $('#save').on('click', ()=>{
        let image = document.getElementById('draw-canvas')
        let link = document.createElement('a');
        link.setAttribute('download', 'image')
        link.setAttribute('href', image.toDataURL())
        link.click()
    });
    
    setInterval(()=>{
    }, 500)

})



