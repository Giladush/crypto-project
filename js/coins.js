const COINS_API =
  'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1';

let allCoins = [];

const SELECTED_STORAGE_KEY = 'selectedCoins';
let selectedSymbols = JSON.parse(localStorage.getItem(SELECTED_STORAGE_KEY) || '[]'); 
let pendingSymbol = null;

const saveSelected = () => {
  localStorage.setItem(SELECTED_STORAGE_KEY, JSON.stringify(selectedSymbols));
};


const COIN_INFO_API = (id) => `https://api.coingecko.com/api/v3/coins/${id}`;
const COIN_INFO_CACHE_TTL_MS = 2 * 60 * 1000; 
const coinInfoCache = {}; 


const loadCoinsPage = () => {
  const content = $('#content');
  content.empty();

  const title = $('<h2>').text('Coins');
  const loader = $('<div class="spinner-border text-primary" role="status"></div>');

  const searchBar = $(`
  <div class="row g-2 align-items-center mb-3">
    <div class="col-12 col-md-6">
      <input id="search-symbol" class="form-control" placeholder="Search for coin" />
    </div>
    <div class="col-12 col-md-auto">
      <button id="btn-search" class="btn btn-primary w-100">Search</button>
    </div>
    <div class="col-12 col-md-auto">
      <button id="btn-clear" class="btn btn-outline-secondary w-100">Clear</button>
    </div>
  </div>
`);

content.append(title, searchBar, loader);

ensureToggleModal();



  $.ajax({
    url: COINS_API,
    method: 'GET',
    success: (coins) => {
    loader.remove();
    allCoins = coins;
    renderCoins(allCoins);
    wireSearchEvents();

    },
    error: () => {
      loader.remove();
      content.append('<p>Error loading coins</p>');
    }
  });
};

const renderCoins = (coins) => {
  const content = $('#content');

  
  content.find('.coins-grid').remove();

  const row = $('<div class="row coins-grid"></div>');

  coins.forEach(coin => {
    const col = $('<div class="col-12 col-md-6 col-lg-3 mb-3"></div>');

   const card = $(`
  <div class="card h-100">
    <div class="card-body">
      <div class="d-flex gap-3 align-items-center mb-2">
        <img src="${coin.image}" alt="${coin.symbol}" width="32" height="32"/>
        <div>
          <h5 class="card-title mb-1">${coin.symbol.toUpperCase()}</h5>
          <p class="card-text mb-0">${coin.name}</p>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center">
        <button class="btn btn-sm btn-outline-primary btn-more"
        data-coin-id="${coin.id}"
        data-bs-toggle="collapse"
        data-bs-target="#collapse-${coin.id}">
        More Info
        </button>


        <div class="form-check form-switch m-0">
          <input class="form-check-input coin-toggle" type="checkbox" data-symbol="${coin.symbol.toUpperCase()}">
        </div>
      </div>

      <div class="collapse mt-3" id="collapse-${coin.id}">
        <div class="border rounded p-2" id="info-${coin.id}">
          <!-- filled dynamically -->
        </div>
      </div>
    </div>
  </div>
`);


    col.append(card);
    row.append(col);
  });

  content.append(row);

  syncTogglesToSelected();
  wireToggleEvents();
  wireCoinCardEvents();

};

const wireSearchEvents = () => {
  $('#btn-search').off('click').on('click', () => {
    const value = $('#search-symbol').val().trim().toLowerCase();
    if (!value) {
      renderCoins(allCoins);
      return;
    }

    
    const filtered = allCoins.filter(c => (c.symbol || '').toLowerCase() === value);
    renderCoins(filtered);
  });

  $('#btn-clear').off('click').on('click', () => {
    $('#search-symbol').val('');
    renderCoins(allCoins);
  });


  $('#search-symbol').off('keydown').on('keydown', (e) => {
    if (e.key === 'Enter') $('#btn-search').click();
  });
};

const wireCoinCardEvents = () => {
  
  $('.btn-more').off('click').on('click', function () {
    const id = $(this).data('coin-id');
    loadMoreInfo(id);
  });
};

const loadMoreInfo = (id) => {
  const infoBox = $(`#info-${id}`);

  

  const cached = coinInfoCache[id];
  const now = Date.now();

  if (cached && (now - cached.ts) <= COIN_INFO_CACHE_TTL_MS) {
    renderMoreInfo(id, cached.data);
    return;
  }


  infoBox.html(`<div class="spinner-border text-primary" role="status"></div>`);

  $.ajax({
    url: COIN_INFO_API(id),
    method: 'GET',
    success: (data) => {
      coinInfoCache[id] = { data, ts: Date.now() };
      renderMoreInfo(id, data);
    },
    error: () => {
      infoBox.html('<p class="m-0 text-danger">Error loading info</p>');
    }
  });
};

const renderMoreInfo = (id, data) => {
  const infoBox = $(`#info-${id}`);

  const img = data?.image?.small || '';
  const usd = data?.market_data?.current_price?.usd;
  const eur = data?.market_data?.current_price?.eur;
  const ils = data?.market_data?.current_price?.ils;

  infoBox.html(`
    <div class="d-flex align-items-center gap-2 mb-2">
      ${img ? `<img src="${img}" width="32" height="32" alt="coin"/>` : ''}
      <strong>Prices</strong>
    </div>
    <div>$ ${usd ?? 'N/A'}</div>
    <div>€ ${eur ?? 'N/A'}</div>
    <div>₪ ${ils ?? 'N/A'}</div>
  `);
};

const syncTogglesToSelected = () => {
  $('.coin-toggle').each(function () {
    const sym = $(this).data('symbol');
    $(this).prop('checked', selectedSymbols.includes(sym));
  });
};

const wireToggleEvents = () => {
  
  $(document).off('change', '.coin-toggle').on('change', '.coin-toggle', function () {
    const sym = $(this).data('symbol');

    
    if (!this.checked) {
      selectedSymbols = selectedSymbols.filter(s => s !== sym);
      saveSelected();
      return;
    }

    
    if (selectedSymbols.includes(sym)) return;

    
    if (selectedSymbols.length < 5) {
      selectedSymbols.push(sym);
      saveSelected();
      return;
    }

    
    $(this).prop('checked', false);
    pendingSymbol = sym;
    openToggleModal(sym);
  });
};

const ensureToggleModal = () => {
  if ($('#toggleLimitModal').length) return;

  const modal = $(`
    <div class="modal fade" id="toggleLimitModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">You can select up to 5 coins</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body">
            <p class="mb-2">To add <strong id="pendingCoinText"></strong>, choose one coin to remove:</p>
            <div id="selectedList" class="d-flex flex-column gap-2"></div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="btn-confirm-replace">Replace</button>
          </div>
        </div>
      </div>
    </div>
  `);

  $('body').append(modal);

  $('#btn-confirm-replace').on('click', () => {
    const toRemove = $('input[name="removeCoinRadio"]:checked').val();

    if (!toRemove || !pendingSymbol) return;

    selectedSymbols = selectedSymbols.filter(s => s !== toRemove);
    selectedSymbols.push(pendingSymbol);
    saveSelected();

    pendingSymbol = null;

    
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('toggleLimitModal'));
    modalInstance.hide();

    
    syncTogglesToSelected();
  });
};

const openToggleModal = (newSym) => {
  $('#pendingCoinText').text(newSym);

  const list = $('#selectedList');
  list.empty();

  selectedSymbols.forEach((sym, idx) => {
    const item = $(`
      <label class="d-flex align-items-center gap-2 border rounded p-2">
        <input type="radio" name="removeCoinRadio" value="${sym}" ${idx === 0 ? 'checked' : ''}/>
        <span>${sym}</span>
      </label>
    `);
    list.append(item);
  });

  const modalEl = document.getElementById('toggleLimitModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
};





