// 宣告遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMatched: 'CardsMatched',
  GameFinished: 'GameFinished'
}

// Symbols = ['Diamond', 'Heart', 'Spade', 'Club'];
const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105219.svg',
  'https://image.flaticon.com/icons/svg/105/105212.svg',
  'https://image.flaticon.com/icons/svg/105/105220.svg',
  'https://image.flaticon.com/icons/svg/105/105223.svg'
]

const view = {

  // 回傳卡片的外層元素，只顯示卡背
  // 接收一個 index 參數，將他存放在 dataset 中
  getCardBackElement (index) {
    return `<div data-index="${index}" class="card back"></div>`
  },

  // 回傳卡片的內層元素，顯示數字和花色
  // 接收一個 index 參數，將他換算成數字與花色
  getCardElement (index) {
    const symbol = Symbols[Math.floor(index / 13)]
    const number = index % 13

    return `<p>${number + 1}</p><img src="${symbol}"><p>${number + 1}</p>`
  },

  // 翻轉卡片
  // 如果他的 class 有 back，則拿掉 back class 並將內層元素加上去
  // 如果他的 class 沒有 back，則拿掉內層元素，並加上 back class
  flipCards (...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardElement(card.dataset.index)
        return
      }

      card.innerHTML = null
      card.classList.add('back')
    })
  },

  // 把卡片加上 paired class
  pairCards (...cards) {
    cards.map(card => card.classList.add('paired'))
  },

  // 接收一個 indexes 參數，他是一個 index 的陣列
  // 將每個 index 轉換成卡背元素，之後加到 #cards 內容裡
  renderCards (indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardBackElement(index)).join('')
  },

  // 更新 Score 畫面
  renderScore (score) {
    document.querySelector('.score').innerHTML = `Score: ${score}`
  },

  // 更新 Tried times 畫面
  renderTriedTimes (times) {
    document.querySelector('.tried').innerHTML = `You've tried: ${times} times`
  },

  // 幫卡片加上嘗試失敗的動畫，先加上一個 animation class，動畫結束後把 class 拿掉
  // 後面的 once: true 是指這個 event listener 在執行一次之後就會消失
  appendWrongAnimation (...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },

  // 顯示遊戲結束的畫面
  showGameFinished () {
    const completeText = document.createElement('p')
    const header = document.querySelector('#header')
    const cards = document.querySelector('#cards')

    completeText.classList.add('complete')
    completeText.innerText = 'Complete!'

    header.insertBefore(completeText, document.querySelector('#header .score'))
    header.classList.add('completed')
    cards.classList.add('completed')
  }
}

const controller = {
  // 當前狀態，一開始設定為 FirstCardAwaits
  currentState: GAME_STATE.FirstCardAwaits,

  // 呼叫 view，並傳入一個隨機 52 數字的陣列
  generateCards () {
    view.renderCards(utility.getRandomNumberArray(52))
  },

  // 在點擊卡片時，依照不同的狀態，會執行不同的動作
  dispatchCardAction (card) {
    // 不是牌背狀態的卡片，點了不執行動作
    if (!card.classList.contains('back')) {
      return
    }

    switch (this.currentState) {
      // 在 FirstCardAwaits 狀態點擊卡片的話，會將卡片翻開，然後進入 SecondCardAwaits 狀態
      case GAME_STATE.FirstCardAwaits:
        this.revealCard(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        return

      // 在 SecondCardAwaits 狀態點擊卡片的話，會將卡片翻開，接著檢查翻開的兩張卡是否數字相同
      case GAME_STATE.SecondCardAwaits:
        this.revealCard(card)
        view.renderTriedTimes(++model.triedTimes)
        
        // 數字相同（配對成功）的話，就計分
        if (model.isRevealedCardsMatched()) {
          this.currentState = GAME_STATE.CardsMatched
          this.score()
          return
        }

        // 配對失敗的話，跑個動畫然後把卡片翻回去
        this.currentState = GAME_STATE.CardsMatchFailed
        view.appendWrongAnimation(...model.revealedCards)
        setTimeout(this.resetRevealedCards, 1000)
        
    }
  },

  // 將已經翻開來的卡片翻回去，而且把 model 裡面的 revealedCards 清掉
  resetRevealedCards () {
    view.flipCards(...model.revealedCards)
    model.clearRevealedCards()
    // 狀態也回歸到 FirstCardAwaits
    controller.currentState = GAME_STATE.FirstCardAwaits
  },

  // 翻開卡片，並在 model 的 revealedCards 中記錄
  revealCard (card) {
    model.revealedCards.push(card)
    view.flipCards(card)
  },

  // 計分
  score () {
    view.renderScore((model.score += 10))
    view.pairCards(...model.revealedCards)
    model.clearRevealedCards()
    // 狀態也回歸到 FirstCardAwaits
    this.currentState = GAME_STATE.FirstCardAwaits

    if (model.score == 260) {
      this.currentState = GAME_STATE.GameFinished
      view.showGameFinished()
    }
  }
}

const model = {
  revealedCards: [],

  // 檢查 model 內記錄的兩張卡片是否數字相同
  isRevealedCardsMatched () {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  clearRevealedCards () {
    this.revealedCards = []
  },

  triedTimes: 0,

  score: 0
}

const utility = {
  getRandomNumberArray (count) {
    const number = [...Array(count).keys()]
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
      ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }

    return number
  }
}

controller.generateCards()

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', event => {
    controller.dispatchCardAction(event.target)
  })
})
