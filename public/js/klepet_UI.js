function divElementEnostavniTekst(sporocilo) {
  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}


function divElementImg(sporocilo) {
  var zacetek=sporocilo.indexOf('http'); 
  var konec=sporocilo.length;
  sporocilo=sporocilo.substring(zacetek, konec);
  
  var img = $('<img />', { 
    id: 'MyImg',
    src: sporocilo,
    width: 200
    })
  return (img);
}

/////
function divElementYt(sporocilo) {
  var zacetek=sporocilo.indexOf('https://www.youtube.com/watch?v=')+32; 
  var konec=sporocilo.length;
  sporocilo="https://www.youtube.com/embed/" + sporocilo.substring(zacetek, konec);
  
  var ytv = $('<iFrame />', { 
    id: 'MyVid',
    src: sporocilo+'?autoplay=1',
    allowfullscreen: ""
    })
  return (ytv);
}

function isImg(sporocilo) {
 return((sporocilo.indexOf('http://') > -1) || (sporocilo.indexOf('https://') > -1)) && ((sporocilo.indexOf('.jpg') > -1) || (sporocilo.indexOf('.png') > -1) || (sporocilo.indexOf('.gif') > -1)) && (sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/')==-1);
}

function isYt(sporocilo) {
 return((sporocilo.indexOf('https://www.youtube.com/watch?v=') > -1));
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo,trenutniVzdevek);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
      /////
      if(isImg(sistemskoSporocilo)){$('#sporocila').append(divElementImg(sistemskoSporocilo));}
      if(isYt(sistemskoSporocilo)){$('#sporocila').append(divElementYt(sistemskoSporocilo));}
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    ///////////
    if(isImg(sporocilo)){$('#sporocila').append(divElementImg(sporocilo));}
    if(isYt(sporocilo)){$('#sporocila').append(divElementYt(sporocilo));}
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    
    ///////////////// 
    if(isImg(sporocilo.besedilo)){$('#sporocila').append(divElementImg(sporocilo.besedilo));}
    
    if(isYt(sporocilo.besedilo)){$('#sporocila').append(divElementYt(sporocilo.besedilo));}

  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function() {

     $('#poslji-sporocilo').val("/zasebno \"" +$(this).text() + "\"");
     $('#poslji-sporocilo').focus();
     });
    
  });
  
  /////////////////////////
    socket.on('dregljaj', function (dregljaj) {
      $('#vsebina').jrumble();
      $('#vsebina').trigger('startRumble');
      setInterval(function(){  $('#vsebina').trigger('stopRumble'); }, 1500);
      
    });


  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
