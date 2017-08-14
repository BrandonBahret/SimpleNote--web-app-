function noteFromDataSnapshot(data){
  var noteData = data.val();
  if(noteData == null){
    return null;
  } else {
    return new Note(noteData.name, noteData.text, data.getKey());
  }
}

function Note(name, text, id){
  this.name = name;
  this.text = text;
  this.id = id;

  this.setId = function(id){
    this.id = id;
  }

  this.render = function(){
    var removeNoteStr = "'askToDeleteNote(\""+this.id+"\")'";
    var editNoteStr = "'openEditorForNoteId(\""+this.id+"\")'";

    return "<div class=\"note-card\" id=\""+this.id+"\">"+
      "<p onclick="+editNoteStr+" class=\"note-text waves-effect\">"+this.text+"</p>"+
      "<div class=\"note-toolbar\">"+
        "<p class=\"note-name truncate\">"+this.name+"</p>"+
        "<button onclick="+removeNoteStr+" class=\"remove-note valign-wrapper\"><i class=\"material-icons\">close</i></button>"+
      "</div>"+
    "</div>";
  }

  this.toPojo = function(){
    return {
      name: this.name,
      text: this.text
    };
  }
}
