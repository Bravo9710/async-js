const baseUrl = "https://baas.kinvey.com/";
const appKey = "kid_rJqtCeLpT";
const secretWord = "1b9eb6e0acdf456ab77a93da8213f9e5";
const authHeaders = {
  Authorization: "Basic " + btoa(appKey + ":" + secretWord),
};

function startApp() {
  sessionStorage.clear();
  showHideMenuLinks();
  showView("viewHome");

  $("#linkHome").click(showHomeView);
  $("#linkLogin").click(showLoginView);
  $("#linkRegister").click(showRegisterView);
  $("#linkListBooks").click(listBooks);
  $("#linkCreateBook").click(showCreateBookView);
  $("#linkLogout").click(logoutUser);

  $("#formLogin").submit(loginUser);
  $("#buttonLoginUser").click(loginUser);
  $("#buttonRegisterUser").click(registerUser);
  $("#buttonCreateBook").click(createBook);
  $("#buttonEditBook").click(editBook);

  $("form").submit(function (e) {
    e.preventDefault();
  });

  $("#infoBox, #errorBox").click(function () {
    $(this).fadeOut();
  });
  $(document).on({
    ajaxStart: function () {
      $("#loadingBox").show();
    },
    ajaxStop: function () {
      $("#loadingBox").hide();
    },
  });
}

function showHideMenuLinks() {
  const authToken = sessionStorage.getItem("authToken");
  $("#linkHome").show();
  if (authToken) {
    // We have a logged in user
    $("#linkLogin, #linkRegister").hide();
    $("#linkListBooks, #linkCreateBook, #linkLogout").show();
  } else {
    // No logged in user
    $("#linkLogin, #linkRegister").show();
    $("#linkListBooks, #linkCreateBook, #linkLogout").hide();
  }
}

function showView(viewName) {
  // Hide all views and show the selected view only
  $("main > section").hide();
  $("#" + viewName).show();
}

function showHomeView() {
  showView("viewHome");
}

function showLoginView() {
  showView("viewLogin");
  $("#formLogin").trigger("reset");
}

function showRegisterView() {
  showView("viewRegister");
  $("#formRegister").trigger("reset");
}

function showCreateBookView() {
  showView("viewCreateBook");
  $("#formCreateBook").trigger("reset");
}

function loginUser() {
  const userData = {
    username: $("#formLogin input[name=username]").val(),
    password: $("#formLogin input[name=passwd]").val(),
  };
  $.ajax({
    method: "POST",
    url: `${baseUrl}user/${appKey}/login`,
    headers: authHeaders,
    data: userData,
    success: loginSuccess,
    error: handleAjaxError,
  });

  function loginSuccess(userInfo) {
    saveAuthInSession(userInfo);
    showHideMenuLinks();
    listBooks();
    showInfo("Login successful.");
  }
}

function registerUser() {
  const userData = {
    username: $("#formRegister input[name=username]").val(),
    password: $("#formRegister input[name=passwd]").val(),
  };
  $.ajax({
    method: "POST",
    url: `${baseUrl}user/${appKey}/`,
    headers: authHeaders,
    data: userData,
    success: registerSuccess,
    error: handleAjaxError,
  });

  function registerSuccess(userInfo) {
    saveAuthInSession(userInfo);
    showHideMenuLinks();
    listBooks();
    showInfo("User registration successful.");
  }
}

function saveAuthInSession(userInfo) {
  const {
    _kmd: { authtoken },
    _id,
    username,
  } = userInfo;
  sessionStorage.setItem("authToken", authtoken);
  sessionStorage.setItem("userId", _id);
  $("#loggedInUser").text(`Welcome, ${username}!`);
}

function handleAjaxError(response) {
  let errorMsg = "Something went wrong.";
  if (response.readyState === 0)
    errorMsg = "Cannot connect due to network error.";
  else if (response.responseJSON && response.responseJSON.description)
    errorMsg = response.responseJSON.description;
  showError(errorMsg);
}

function showInfo(message) {
  $("#infoBox").text(message).show().fadeOut(3000);
}

function showError(errorMsg) {
  $("#errorBox").text(`Error: ${errorMsg}`).show();
}

function logoutUser() {
  sessionStorage.clear();
  $("#loggedInUser").text("");
  showHideMenuLinks();
  showView("viewHome");
  showInfo("Logout successful.");
}

function listBooks() {
  $("#books").empty();
  showView("viewBooks");
  $.ajax({
    method: "GET",
    url: `${baseUrl}appdata/${appKey}/books`,
    headers: getKinveyUserAuthHeaders(),
    success: loadBooksSuccess,
    error: handleAjaxError,
  });

  function loadBooksSuccess(books) {
    showInfo("Books loaded.");
    if (books.length === 0) {
      $("#books").text("No books in the library.");
    } else {
      const booksTable = $("<table>").append(
        $("<tr>").append(
          "<th>Title</th><th>Author</th>",
          "<th>Description</th><th>Actions</th>",
        ),
      );
      for (const book of books) appendBookRow(book, booksTable);
      $("#books").append(booksTable);
    }
  }
}

function getKinveyUserAuthHeaders() {
  return {
    Authorization: `Kinvey ${sessionStorage.getItem("authToken")}`,
  };
}

function appendBookRow(book, booksTable) {
  let links = [];
  if (book._acl.creator === sessionStorage.getItem("userId")) {
    const deleteLink = $('<a href="#">[Delete]</a>').click(() =>
      deleteBook(book),
    );
    const editLink = $('<a href="#">[Edit]</a>').click(() =>
      loadBookForEdit(book),
    );
    links = [deleteLink, " ", editLink];
  }

  booksTable.append(
    $("<tr>").append(
      $("<td>").text(book.title),
      $("<td>").text(book.author),
      $("<td>").text(book.description),
      $("<td>").append(links),
    ),
  );
}

function createBook() {
  const bookData = {
    title: $("#formCreateBook input[name=title]").val(),
    author: $("#formCreateBook input[name=author]").val(),
    description: $("#formCreateBook textarea[name=descr]").val(),
  };
  $.ajax({
    method: "POST",
    url: `${baseUrl}appdata/${appKey}/books`,
    headers: getKinveyUserAuthHeaders(),
    data: bookData,
    success: createBookSuccess,
    error: handleAjaxError,
  });

  function createBookSuccess(response) {
    listBooks();
    showInfo("Book created.");
  }
}

function editBook() {
  const bookData = {
    title: $("#formEditBook input[name=title]").val(),
    author: $("#formEditBook input[name=author]").val(),
    description: $("#formEditBook textarea[name=descr]").val(),
  };
  const bookId = $("#formEditBook input[name=id]").val();
  $.ajax({
    method: "PUT",
    url: `${baseUrl}appdata/${appKey}/books/${bookId}`,
    headers: getKinveyUserAuthHeaders(),
    data: bookData,
    success: editBookSuccess,
    error: handleAjaxError,
  });

  function editBookSuccess(response) {
    listBooks();
    showInfo("Book edited.");
  }
}
