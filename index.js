// Methods responsible for manipulating the firebase realtime-database
function getDatabaseRef(uid){
  return firebase.database().ref().child('users/'+uid+'/notes');
}

function writeNewNote(uid, note) {
  Materialize.toast('Note Created!', 4000);
  var newPushRef = getDatabaseRef(uid).push();
  newPushRef.set(note.toPojo());
  return newPushRef.getKey();
}

function updateNote(uid, noteToUpdateKey, newNote){
  Materialize.toast('Note Updated!', 4000);
  return getDatabaseRef(uid).child(noteToUpdateKey).set(newNote.toPojo());
}

function deleteNote(uid, noteToRemoveKey){
  Materialize.toast('Note Removed!', 4000);
  return getDatabaseRef(uid).child(noteToRemoveKey).remove();
}

function openEditorForNoteId(noteId){
  // Find note card by it's id. Then read it's data from the dom.
  var noteCard = $("#"+noteId);
  var noteText = noteCard.find(".note-text").text();
  var noteName = noteCard.find(".note-name").text();
  var note = new Note(noteName, noteText, noteId);

  // Set this note to be the active note.
  selectedNote = noteId;

  // Open the note editor modal, then set it's fields with this note's data.
  $('#note-editor').modal('open');
  $('#note-title-input').val(note.name);
  $('#note-text-input').val(note.text);
}

function saveNoteInEditor(){
  var noteText = $('#note-text-input').val();
  var noteName = $('#note-title-input').val();
  var note = new Note(noteName, noteText);
  var uid = firebase.auth().currentUser.uid;

  if(selectedNote != null){
    updateNote(uid, selectedNote, note);
  } else{
    // Update the selectedNote id for the new note
    selectedNote = writeNewNote(uid, note);
  }
}

function askToDeleteNote(noteId){
  selectedNote = noteId;
  $('#delete-note-confirm').modal('open');
}
function deleteSelectedNote(){
  if(selectedNote != null){
    var uid = firebase.auth().currentUser.uid;
    deleteNote(uid, selectedNote);
    selectedNote = null;
  }
}
//endregion -- end --

var selectedNote = null;

$(document).ready(function(){

  var uiConfig = {
    // signInSuccessUrl: 'notes.html',
    'callbacks': {
      // Called when the user has been successfully signed in.
      'signInSuccess': function(user, credential, redirectUrl) {
        handleSignedInUser(user);
        // Do not redirect.
        return false;
      }
    },
    signInOptions: [
      // Specify providers you want to offer your users.
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.EmailAuthProvider.PROVIDER_ID
    ]
  };

  // Initialize the FirebaseUI Widget using Firebase.
  var ui = new firebaseui.auth.AuthUI(firebase.auth());

  // Track the UID of the current user.
  var currentUid = null;
  firebase.auth().onAuthStateChanged(function(user) {
    /*
     * onAuthStateChanged listener triggers every time the user ID token changes.
     * This could happen when a new user signs in or signs out.
     * It could also happen when the current user ID token expires and is refreshed.
    */
    if (user && user.uid != currentUid) {
      /*
      * Update the UI when a new user signs in.
      * Otherwise ignore if this is a token refresh.
      * Update the current user UID.
      */
      currentUid = user.uid;
      handleSignedInUser(user);
    } else {
      // Sign out operation. Reset the current user UID.
      currentUid = null;
      handleSignedOutUser(user);
    }
  });

  // This method is triggered when ever a user signs in
  function handleSignedInUser(user){
    showAppContent();

    // Add listeners for database events
    var dbRef = getDatabaseRef(currentUid);

    dbRef.limitToFirst(1).once("value", function(data){
      var note = noteFromDataSnapshot(data);
      $("#notes-preloader").css("display", "none");
      if(note == null){
        // No notes found
        showNoNotesFound();
      } else {
        // Notes available
        hideNoNotesFound();
      }
    })

    dbRef.on("child_added", function(data){
      hideNoNotesFound();
      var noteHTML = noteFromDataSnapshot(data).render();
      $("#note-container").append(noteHTML);
    });

    dbRef.on("child_changed", function(data){
      var note = noteFromDataSnapshot(data);
      $("#"+note.id).replaceWith(note.render());
    });

    dbRef.on("child_removed", function(data){
      $("#"+data.getKey()).remove();
      var childrenCount = $("#note-container").children().length;
      if(childrenCount == 0){
        showNoNotesFound();
      }
    });
  }

  // This method is triggered when a user signs out, isn't signed in.
  function handleSignedOutUser(user){
    showAuthScreen();

    // Remove listeners from database events
    getDatabaseRef(currentUid).off();
  }

  function showAppContent(){
    $(".auth-req").css("display", "block");
    $(".auth-not-req").css("display", "none");
    $("body").css("overflow", "auto");
  }

  function showAuthScreen(){
    $(".auth-req").css("display", "none");
    $(".auth-not-req").css("display", "block");
    $("body").css("overflow", "hidden");

    // The start method will wait until the DOM is loaded.
    ui.start('#auth-container', uiConfig);
  }

  function showNoNotesFound(){
    $("#no-notes").css("display", "block");
  }

  function hideNoNotesFound(){
    $("#no-notes").css("display", "none");
  }

  // Initialize all modals for Materialize.css
  $('.modal').modal();

  $("#new-note").click(function(){
    selectedNote = null;
    $('#note-editor').modal('open');
    $('#note-title-input').val("");
    $('#note-text-input').val("");
  });

  $("#sign-out").click(function(){
    firebase.auth().signOut();
  });

});
