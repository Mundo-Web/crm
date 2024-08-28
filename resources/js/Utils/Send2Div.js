const Send2Div = (div) => 
{
  const item = $('#icon-2-send')
  item.addClass('sending-to-div')
  setTimeout(() => {
    item.removeClass('sending-to-div')
    $(div).addClass('shake');
    setTimeout(function () {
      $(div).removeClass('shake');
    }, 1000)
  }, 1000);
}

export default Send2Div