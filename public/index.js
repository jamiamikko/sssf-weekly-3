'use strict';

let picArray;
let filterArray;

const modal = document.getElementById('modal');
const sortGirlfriendBtn = document.getElementById('sort-girlfriend');
const sortWifedBtn = document.getElementById('sort-wife');
const sortResetBtn = document.getElementById('sort-reset');
const displayDateBtn = document.querySelector('#display-date');
const thumbnailList = document.querySelector('#thumbnail-list');
const tabs = document.querySelectorAll('a.tab');
const tabContents = document.querySelectorAll('.tab__content');
const eventForm = document.querySelector('#add-event');
const inputLatitude = document.querySelector('#latitude');
const inputLongitude = document.querySelector('#longitude');

const initThumbnails = (array) => {
  thumbnailList.innerHTML = '';

  for (let picture of array) {
    const template = document.querySelector('#thumbnail');

    const img = template.content.querySelector('img');
    img.src = picture.thumbnail;

    const title = template.content.querySelector('.thumbnail__title');
    title.textContent = picture.title;

    const date = template.content.querySelector('.thumbnail__date');
    date.textContent = picture.time;

    const description = template.content.querySelector(
      '.thumbnail__description'
    );

    description.textContent = picture.details;

    const li = template.content.querySelector('li');
    li.id = picture._id;

    const clone = document.importNode(template.content, true);

    thumbnailList.appendChild(clone);
  }
};

const toggleModalVisibility = () => {
  if (modal.style.visibility == 'visible') {
    modal.style.visibility = 'hidden';
  } else {
    modal.style.visibility = 'visible';
  }
};

const openModal = (event) => {
  toggleModalVisibility();
  const closeButton = document.querySelector('#modal-close');

  closeButton.addEventListener('click', toggleModalVisibility, false);

  const id = event.target.parentElement.getAttribute('id');

  const img = modal.querySelector('.modal__image');

  const dataObj = filterArray.filter((picture) => picture._id === id)[0];

  img.src = dataObj.image;

  const coordinates = dataObj.coordinates;

  marker.setPosition(coordinates);
};

const sortArray = (category) => {
  if (category !== 'reset') {
    filterArray = picArray.filter((picture) => {
      return picture.category === category;
    });
  } else {
    filterArray = picArray;
  }

  initThumbnails(filterArray);
};

const toggleDate = () => {
  const dates = document.querySelectorAll('.thumbnail__date');

  dates.forEach((date) => {
    date.classList.toggle('hidden');

    if (date.classList.contains('hidden')) {
      displayDateBtn.textContent = 'Date on';
    } else {
      displayDateBtn.textContent = 'Date off';
    }
  });
};

const switchTab = (event) => {
  const id = event.target.dataset.content;
  const tabContent = document.querySelector(id);

  tabs.forEach((tab) => {
    tab.classList.remove('active');
  });

  tabContents.forEach((content) => {
    content.classList.remove('open');
  });

  event.target.classList.add('active');
  tabContent.classList.add('open');
};

const getCoordinates = () => {
  return {
    lat: marker.getPosition().lat(),
    lng: marker.getPosition().lng()
  };
};

const submitForm = (event) => {
  event.preventDefault();

  const coordinates = getCoordinates();
  inputLatitude.value = coordinates.lat;
  inputLongitude.value = coordinates.lng;

  const formData = new FormData(eventForm);

  fetch('http://localhost:3000/upload', {
    method: 'POST',
    body: formData
  })
    .then((res) => {
      console.log('Success');
      getData().then((res) => {
        handleData(res);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const deleteImage = (event) => {
  const thumbnail = event.target.parentElement;
  const id = thumbnail.getAttribute('id');

  const url = 'http://localhost:3000/delete/' + id;

  fetch(url, {
    method: 'DELETE',
  })
  .then((res) => {
    console.log('Success');
    getData().then((res) => {
      handleData(res);
    });
  })
  .catch((err) => {
    console.log(err);
  });
};

const getData = () =>
  new Promise((resolve, reject) => {
    fetch('http://localhost:3000/get-images')
      .then((res) => {
        resolve(res.json());
      })
      .catch((err) => {
        reject(err);
      });
  });

const handleData = (data) => {
  picArray = data;
  filterArray = picArray;

  initThumbnails(picArray);

  const buttons = document.querySelectorAll('.thumbnail__button');

  buttons.forEach((button) => {
    button.addEventListener('click', openModal, false);
  });

  const deleteButtons = document.querySelectorAll('.thumbnail__delete');

  deleteButtons.forEach((button) => {
    button.addEventListener('click', deleteImage, false);
  });
};

const init = () => {
  getData()
    .then((res) => {
      handleData(res);
    })
    .catch((err) => console.log(err));

  tabs.forEach((tab) => {
    tab.addEventListener('click', switchTab, false);
  });

  sortGirlfriendBtn.addEventListener(
    'click',
    () => {
      sortArray('Girlfriend');
    },
    false
  );

  sortWifedBtn.addEventListener(
    'click',
    () => {
      sortArray('Wife');
    },
    false
  );

  sortResetBtn.addEventListener(
    'click',
    () => {
      sortArray('reset');
    },
    false
  );

  displayDateBtn.addEventListener('click', toggleDate, false);
  eventForm.addEventListener('submit', submitForm, false);
};

init();
