'use strict';

let orignalArray;
let filteredArray;

const modal = document.getElementById('modal');
const sortGirlfriendBtn = document.getElementById('sort-girlfriend');
const sortWifedBtn = document.getElementById('sort-wife');
const sortResetBtn = document.getElementById('sort-reset');
const displayDateBtn = document.querySelector('#display-date');
const thumbnailList = document.querySelector('#thumbnail-list');
const tabs = document.querySelectorAll('a.tab');
const tabContents = document.querySelectorAll('.tab__content');
const addImageForm = document.querySelector('#add-image');
const inputLatitude = document.querySelector('#add-latitude');
const inputLongitude = document.querySelector('#add-longitude');
const searchInput = document.querySelector('#search');

const setThumbnails = (array) => {
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

const closeModal = () => {
  modal.style.visibility = 'hidden';
};

const openModal = () => {
  modal.style.visibility = 'visible';
};

const openViewModal = (event) => {
  modal.innerHTML = '';

  const template = document.querySelector('#view-modal');

  const id = event.target.parentElement.getAttribute('id');

  const img = template.content.querySelector('.modal__image');

  const dataObj = filteredArray.filter((picture) => picture._id === id)[0];

  img.src = dataObj.image;

  const coordinates = dataObj.coordinates;
  marker.setPosition(coordinates);

  const clone = document.importNode(template.content, true);

  modal.appendChild(clone);

  const closeButton = document.querySelector('.modal__close');
  closeButton.addEventListener('click', closeModal, false);
  openModal();
};

const submitEditForm = (event, id) => {
  event.preventDefault();

  const editLatitude = document.querySelector('#edit-latitude');
  const editLongitude = document.querySelector('#edit-longitude');
  const inputCategory = document.querySelector('#edit-category');
  const inputTitle = document.querySelector('#edit-title');
  const inputDescription = document.querySelector('#edit-description');

  const data = {
    id: id,
    coordinates: {
      lat: editLatitude.value,
      lng: editLongitude.value
    },
    category: inputCategory.value,
    title: inputTitle.value,
    details: inputDescription.value
  };

  const jsonData = JSON.stringify(data);

  console.log(jsonData);

  fetch('http://localhost:3000/update/' + id, {
    method: 'POST',
    body: jsonData,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  })
    .then((data) => {
      console.log(data);
      closeModal();

      getData().then((res) => {
        handleData(res);
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

const openEditModal = (event) => {
  const id = event.target.parentElement.getAttribute('id');

  getDataById(id)
    .then((res) => {
      console.log(res);
      modal.innerHTML = '';

      const template = document.querySelector('#edit-modal');

      const editLatitude = template.content.querySelector('#edit-latitude');
      editLatitude.value = res.coordinates.lat;

      const editLongitude = template.content.querySelector('#edit-longitude');
      editLongitude.value = res.coordinates.lng;

      const inputCategory = template.content.querySelector('#edit-category');
      inputCategory.value = res.category;

      const inputTitle = template.content.querySelector('#edit-title');
      inputTitle.value = res.title;

      const inputDescription = template.content.querySelector(
        '#edit-description'
      );
      inputDescription.value = res.details;

      const clone = document.importNode(template.content, true);

      modal.appendChild(clone);

      const closeButton = document.querySelector('.modal__close');
      closeButton.addEventListener('click', closeModal, false);

      const editForm = document.querySelector('#edit-image');

      editForm.addEventListener(
        'submit',
        (event) => {
          submitEditForm(event, id);
        },
        false
      );

      openModal();
    })
    .catch((err) => {
      console.log(err);
    });
};

const sortArray = (category) => {
  if (category !== 'reset') {
    filteredArray = orignalArray.filter((picture) => {
      return picture.category === category;
    });
  } else {
    filteredArray = orignalArray;
  }

  setThumbnails(filteredArray);
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

const handleData = (data) => {
  orignalArray = data;
  filteredArray = orignalArray;

  setThumbnails(orignalArray);

  const viewButtons = document.querySelectorAll('.thumbnail__view-button');

  viewButtons.forEach((button) => {
    button.addEventListener('click', openViewModal, false);
  });

  const editButtons = document.querySelectorAll('.thumbnail__edit-button');

  editButtons.forEach((button) => {
    button.addEventListener('click', openEditModal, false);
  });

  const deleteButtons = document.querySelectorAll('.thumbnail__delete');

  deleteButtons.forEach((button) => {
    button.addEventListener('click', deleteImage, false);
  });
};

const submitForm = (event) => {
  event.preventDefault();

  const coordinates = getCoordinates();
  inputLatitude.value = coordinates.lat;
  inputLongitude.value = coordinates.lng;

  const formData = new FormData(addImageForm);

  fetch('http://localhost:3000/upload', {
    method: 'PUT',
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
    method: 'DELETE'
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

const getDataById = (id) =>
  new Promise((resolve, reject) => {
    fetch('http://localhost:3000/get-images/' + id)
      .then((res) => {
        resolve(res.json());
      })
      .catch((err) => {
        reject(err);
      });
  });

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

const filterSearch = (event) => {
  const value = event.target.value.toLowerCase();

  if (!value) {
    setThumbnails(orignalArray);
  } else {
    const searchArray = filteredArray.filter((image) => {
      return (
        image.category.toLowerCase().includes(value) ||
        image.details.toLowerCase().includes(value) ||
        image.title.toLowerCase().includes(value)
      );
    });

    setThumbnails(searchArray);
  }
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
  addImageForm.addEventListener('submit', submitForm, false);
  searchInput.addEventListener('input', filterSearch, false);
};

init();
