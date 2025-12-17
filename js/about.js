const loadAboutPage = () => {
  const content = $('#content');
  content.empty();

  const title = $('<h2>').text('About');

  const card = $(`
    <div class="card">
      <div class="card-body">
        <h5 class="card-title mb-2">Crypto Project</h5>
        <p class="card-text m-0">
          My single Page Application built with HTML, CSS, Bootstrap, JavaScript and jQuery.
          The app uses CoinGecko API.
          my name is Gilad, and i look forward to learning more and improving my skills in web development👨🏻‍💻
      </div>
    </div>
  `);

  content.append(title, card);
};
