window.DEBUG_LOG = false;
window.DEBUG_STOP = false;
window.DEBUG_WIDTH = false;

const GRID_AREA_SETTINGS = [
  `
  'area1 area1 area2 area4 area6 area8 area10'
  'area1 area1 area3 area5 area7 area9 area11'
  `,
  `
  'area1 area3 area5 area5 area6 area8 area10'
  'area2 area4 area5 area5 area7 area9 area11'
  `,
  `
  'area1 area3 area5 area7 area9 area9 area10'
  'area2 area4 area6 area8 area9 area9 area11'
  `,
  `
  'area1 area2 area4 area6 area8 area10'
  'area1 area3 area5 area7 area9 area11'
  `,
];

const debug = () => {
  if (DEBUG_WIDTH) {
    $('#fv').width(DEBUG_WIDTH);
  }
};

const changeActiveGrid = (targetGrid, $targetList) => {
  if (!['none', 1, 5, 9].includes(targetGrid)) throw 'invalid targetGrid';

  const GRID_COLUMN_NOT_ACTIVE = 'repeat(6, 250px)';
  const GRID_COLUMN_ACTIVE = 'repeat(7, 250px)';

  $targetList.find('.item').each((_idx, item) => {
    $(item).removeClass('active');
  });

  switch (targetGrid) {
    case 'none': {
      $targetList.css({
        'grid-template-columns': GRID_COLUMN_NOT_ACTIVE,
        'grid-template-areas': GRID_AREA_SETTINGS[3],
      });
      break;
    }
    case 1: {
      $targetList.css({
        'grid-template-columns': GRID_COLUMN_ACTIVE,
        'grid-template-areas': GRID_AREA_SETTINGS[0],
      });
      break;
    }
    case 5: {
      $targetList.css({
        'grid-template-columns': GRID_COLUMN_ACTIVE,
        'grid-template-areas': GRID_AREA_SETTINGS[1],
      });
      break;
    }
    case 9: {
      $targetList.css({
        'grid-template-columns': GRID_COLUMN_ACTIVE,
        'grid-template-areas': GRID_AREA_SETTINGS[2],
      });
      break;
    }
  }

  $targetList.find('.item').each((idx, item) => {
    if (idx + 1 === targetGrid) {
      $(item).addClass('active');
    }
  });
};

const appendList = (version, data) => {
  $('#slider').append(
    $('#template_items').render({
      version: version,
      items: data,
    })
  );

  const $list = $(`#list_${version}`);
  $list.find('.item').each((_idx, item) => {
    const $item = $(item);

    $item.mouseleave(_e => {
      $item.removeClass('hover left top right bottom');
    });

    $item.on('mouseenter', e => {
      const w = $item.width();
      const h = $item.height();
      const x = (e.pageX - $item.offset().left - w / 2) * (w > h ? h / w : 1);
      const y = (e.pageY - $item.offset().top - h / 2) * (h > w ? w / h : 1);

      const direction = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 180) / 90) % 4;

      switch (direction) {
        case 0: // 左
          $(item).addClass('hover left');
          break;
        case 1: // 上
          $(item).addClass('hover top');
          break;
        case 2: // 右
          $(item).addClass('hover right');
          break;
        case 3: // 下
          $(item).addClass('hover bottom');
          break;
        default:
          return false;
      }
    });
  });

  return $list;
};

const listSequence = async (data, version, $prevList) => {
  const $list = appendList(version, shuffle(data));
  changeActiveGrid(9, $list);

  const adjust = (version * 1000) / 2;

  await awaitableTimeout(15000 + adjust);
  changeActiveGrid('none', $prevList);
  changeActiveGrid(1, $list);

  await awaitableTimeout(17500 + adjust);
  changeActiveGrid(5, $list);

  await awaitableTimeout(20000 + adjust);
  changeActiveGrid(9, $list);

  return $list;
};

// @param version: シーケンスを開始するバージョン
// @param $prevList: 1つ前のバージョンのリスト要素
// @param $prevX2List: 2つ前のバージョンリスト要素
const recursiveSequence = async (data, version, $prevList, $prevX2List) => {
  const $list = await listSequence(data, version, $prevList);
  $prevX2List.empty();
  await recursiveSequence(data, version + 1, $list, $prevList);
};

const awaitableTimeout = async (delay = 10000) => {
  await new Promise(resolve =>
    setTimeout(() => {
      if (DEBUG_STOP) throw '';
      resolve();
    }, delay)
  );
};

const initialize = async () => {
  const dataItems = window.DATA_SLIDES;
  const $list1 = appendList(1, dataItems);
  $list1.css({
    opacity: 0,
  });
  changeActiveGrid(5, $list1);

  await new Promise(resolve => {
    const $images = $list1.find('img');
    $images.each((idx, item) => {
      if (idx === $images.length - 1) {
        $(item).on('load', async () => {
          await awaitableTimeout(500);
          resolve();
          if (DEBUG_LOG) {
            console.log('img loaded');
          }
        });
      }
    });
  });
  $('#loading').remove();
  $list1.animate({
    opacity: 1,
  });

  let progress = 1;
  setInterval(() => {
    if (DEBUG_LOG && progress == 1) {
      console.log('start interval');
    }

    debug();
    if (window.DEBUG_STOP) throw '';

    progress++;
    $('#slider').css({ transform: `translateX(-${progress}px)` });
  }, 35);

  await awaitableTimeout();
  changeActiveGrid(9, $list1);

  const $list2 = await listSequence(dataItems, 2, $list1);
  await recursiveSequence(dataItems, 3, $list2, $list1);
};

const shuffle = array => {
  return array.sort(() => Math.random() - 0.5);
};

$(document).ready(initialize);
