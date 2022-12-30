const innerAudioContext = wx.createInnerAudioContext({
  useWebAudioImplement: false // 是否使用 WebAudio 作为底层音频驱动，默认关闭。对于短音频、播放频繁的音频建议开启此选项，开启后将获得更优的性能表现。由于开启此选项后也会带来一定的内存增长，因此对于长音频建议关闭此选项
})

Page({
  data: {
    time: '20:00', // 闹钟时间
    Time: new Date().toTimeString().substring(0, 8), // 本地时间
    hours: 0, // 剩余小时数
    minutes: 0, // 剩余分钟数
    isChecked1: true, // 重复
    isChecked2: false, // 振动
    isChecked3: true, // 稍后提醒
    time_advanced: 30, // 提前的时间，一般取三十
    light: 100, // 屏幕亮度百分比，0-1的小数，随时间变化
    array: ['无', '海洋.mp3', '雷雨.mp3', '流水.mp3', '森林.mp3', '夏日.mp3'], // 背景音乐
    array_bgm: '', // 背景音乐
  },

  onLoad() {
    var that = this;

    // 音频全局配置
    wx.setInnerAudioOption({
      mixWithOther: false, // 是否与其他音频混播
    })

    // 设置音频
    this.data.array_bgm = this.data.array[1];
    this.setData({
      index: 1
    })

    // 保持屏幕常亮
    wx.setKeepScreenOn({
      keepScreenOn: true
    });
    this.differ() // 计算时间差

    // 设定定时器，获取本地时间用
    setInterval(function () {
      that.getTime() // 获取当前时间
    }, 1000);
  },

  // 获取本地时间
  getTime() {
    this.data.Time = new Date().toTimeString().substring(0, 8)
    this.setData({
      Time: this.data.Time
    })
    // 当秒数为0时，计算时间差
    if (this.data.Time.substring(6, 8) == 0) {
      this.differ() // 计算时间差
    }
  },

  // 计算时间差，闹钟时间-本地时间
  differ() {
    var date = new Date(Date.parse(new Date())).toLocaleDateString(); // 获取今天日期，格式如 2022/12/27
    var timestamp = Date.parse(date + " " + this.data.time) // 闹钟时间的时间戳（毫秒）
    var Timestamp = Date.parse(new Date()) // 本地时间的时间戳
    var differ = timestamp - Timestamp; // 时间戳的差

    if (differ < 0) {
      differ = differ + (24 * 3600 * 1000);
    }
    this.data.hours = Math.floor(differ / (3600 * 1000)); // 计算相差小时数
    var leave = differ % (3600 * 1000);
    this.data.minutes = Math.floor(leave / (60 * 1000)); // 计算相差分钟数
    this.setData({
      hours: this.data.hours,
      minutes: this.data.minutes,
    })
    this.judge_time(); // 判断时间是否到了
  },

  // 判断时间是否到了
  judge_time() {
    var judge = 60 * this.data.hours + this.data.minutes; // 剩余时间
    if (judge > this.data.time_advanced) {
      this.waiting(); // 等待中
    } else if (judge <= this.data.time_advanced && judge > 0) {
      this.prepare(); // 准备
    } else if (judge == 0) {
      this.working(); // 时间到
    }
  },

  // 等待中
  waiting() {
    // console.log('等待中')
  },
  // 准备
  prepare() {
    console.log('准备')

    this.music() // 播放音乐
    var judge = 60 * this.data.hours + this.data.minutes; // 剩余时间
    this.setData({
      light: parseInt(100 * (this.data.time_advanced - judge) / this.data.time_advanced) / 100, // 屏幕亮度百分比，如0.85
    })

    // 按比例设置屏幕亮度
    wx.setScreenBrightness({
      value: 1 * (this.data.time_advanced - judge) / this.data.time_advanced
    })
  },
  // 时间到
  working() {
    // 振动
    if (this.data.isChecked2) {
      wx.vibrateLong(); // 长振动
      // wx.vibrateShort({
      //   type: 'heavy', // 震动强度类型，有效值为：heavy、medium、light
      // })
    }

    this.setData({
      light: 1.00, // 屏幕亮度百分比，如0.85
    })
    // 按比例设置屏幕亮度
    wx.setScreenBrightness({
      value: 100
    })

    var that = this;
    // 弹窗提醒
    wx.showModal({
      title: '提醒', // 标题
      content: '时间到！', // 内容
      cancelText: "稍后提醒", // 取消按钮的文字，最多 4 个字符
      confirmText: "关闭", // 确认按钮的文字，最多4个字符
      success(res) {
        if (res.confirm) {
          // console.log('用户点击确定')
          innerAudioContext.stop() // 关闭音频

          // 亮度设为自动，屏幕亮度跟随系统变化（仅安卓端支持，ios无效）
          wx.setScreenBrightness({
            value: -1
          })
        } else if (res.cancel) {
          that.plus(); // 增加5分钟
          that.differ(); // 计算时间差。相当于设置进度条和亮度值
        }
      }
    })
  },

  // 修改时间选择器
  bindTimeChange: function (e) {
    console.log('时间选择器', e.detail.value)
    this.data.time = e.detail.value, // 24小时制时间
      this.setData({
        time: e.detail.value, // 24小时制时间
      })
    this.differ() // 计算时间差
  },
  // 修改开关状态
  changeSwitch1() {
    this.setData({
      isChecked1: !this.data.isChecked1
    });
  },
  // 修改开关状态
  changeSwitch2() {
    this.setData({
      isChecked2: !this.data.isChecked2
    });
  },
  // 修改开关状态
  changeSwitch3() {
    this.setData({
      isChecked3: !this.data.isChecked3
    });
  },

  // 省电
  power_saving() {
    this.setData({
      light: 0, // 屏幕亮度百分比
    })
    // 屏幕亮度最暗
    wx.setScreenBrightness({
      value: 0
    })
  },
  // 结束。重启。
  restart() {
    wx.reLaunch({
      url: '/pages/index/index',
    })

    // 亮度设为自动，屏幕亮度跟随系统变化（仅安卓端支持，ios无效）
    wx.setScreenBrightness({
      value: -1
    })
    innerAudioContext.stop() // 关闭音频
  },

  // 增加5分钟
  plus() {
    var date = new Date(Date.parse(new Date())).toLocaleDateString(); // 获取今天日期，格式如 2022/12/20
    var timestamp = Date.parse(date + " " + this.data.time) // 闹钟时间的时间戳（毫秒）
    var date = new Date(timestamp + 5 * 60 * 1000); // 加5分钟
    this.data.time = date.toTimeString().substring(0, 5); // 截取字符串
    // console.log(this.data.time);
    this.setData({
      time: this.data.time,
    })
  },

  // 选择的音频
  bindPickerChange: function (e) {
    // console.log('音频的下标', e.detail.value)
    // console.log('音频名称',this.data.array[e.detail.value])
    this.data.array_bgm = this.data.array[e.detail.value],
      this.setData({
        index: e.detail.value, // 音频的下标
        name: this.data.array[e.detail.value], // 音频名称
      })
    // 修改音频后要立即同步到播放列表
    this.differ() // 计算时间差
  },

  // 播放音乐
  music() {
    if (this.data.array_bgm !== '') {
      innerAudioContext.src = '/bgm/' + this.data.array_bgm // 音频的路径
    } else if (this.data.array_bgm == '无') {
      return 0;
    }
    innerAudioContext.play() // 播放
    // innerAudioContext.pause() // 暂停
    // innerAudioContext.stop() // 停止
  },

  // 跳转到技术支持
  technical_support() {
    console.log('跳转到技术支持')
  },

  onShareAppMessage() {

  },
})