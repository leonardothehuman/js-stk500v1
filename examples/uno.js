var SerialPort = require("serialport");
var intel_hex = require('intel-hex');
var stk500 = require('../lib/stk500');
var async = require("async");
var fs = require('fs');

var usbttyRE = /(cu\.usb|ttyACM|COM\d+)/;

// var data = ":100000000C945C000C946E000C946E000C946E00CA\n:100010000C946E000C946E000C946E000C946E00A8\n:100020000C946E000C946E000C946E000C946E0098\n:100030000C946E000C946E000C946E000C946E0088\n:100040000C9405010C946E000C946E000C946E00E0\n:100050000C946E000C946E000C946E000C946E0068\n:100060000C946E000C946E0000000007000201006A\n:100070000003040600000000000000000000000073\n:10008000250028002B0000000000240027002A0083\n:10009000040404040404040402020202020203032E\n:1000A0000303030301020408102040800102040836\n:1000B000102001020408102011241FBECFEFD8E049\n:1000C000DEBFCDBF21E0A0E0B1E001C01D92A930AC\n:1000D000B207E1F70E944F010C94BE010C9400009E\n:1000E000E5E7F0E09491E1EBF0E02491EDE9F0E058\n:1000F000E491EE2309F43CC0992339F1933091F057\n:1001000038F49130A9F0923001F594B59F7D12C07A\n:10011000963091F09730A1F09430B9F4909180002E\n:100120009F7D03C0909180009F77909380000DC0C9\n:1001300094B59F7794BD09C09091B0009F7703C09C\n:100140009091B0009F7D9093B000F0E0EE0FFF1F04\n:10015000E458FF4FA591B4919FB7F894811104C062\n:100160008C912095822302C08C91822B8C939FBF0F\n:1001700008953FB7F8948091000190910101A091FA\n:100180000201B091030126B5A89B05C02F3F19F0CD\n:100190000196A11DB11D3FBF6627782F892F9A2F89\n:1001A000620F711D811D911D42E0660F771F881F30\n:1001B000991F4A95D1F70895CF92DF92EF92FF925F\n:1001C000CF93DF930E94B900EB0158EEC52E53E0A8\n:1001D000D52EE12CF12C0E94B9006C1B7D0B683EE2\n:1001E000734038F081E0C81AD108E108F108C8511D\n:1001F000DC4FC114D104E104F10469F7DF91CF9120\n:10020000FF90EF90DF90CF9008951F920F920FB65E\n:100210000F9211242F933F938F939F93AF93BF938C\n:100220008091050190910601A0910701B09108010C\n:100230003091040123E0230F2D3720F40196A11DF6\n:10024000B11D05C026E8230F0296A11DB11D209304\n:1002500004018093050190930601A0930701B093D8\n:1002600008018091000190910101A0910201B091DB\n:1002700003010196A11DB11D80930001909301011E\n:10028000A0930201B0930301BF91AF919F918F9111\n:100290003F912F910F900FBE0F901F90189578945B\n:1002A00084B5826084BD84B5816084BD85B582607B\n:1002B00085BD85B5816085BD80916E00816080932C\n:1002C0006E00109281008091810082608093810095\n:1002D00080918100816080938100809180008160A5\n:1002E000809380008091B10084608093B100809100\n:1002F000B00081608093B00080917A008460809328\n:100300007A0080917A00826080937A0080917A00EE\n:10031000816080937A0080917A00806880937A006F\n:100320001092C100E1EBF0E02491EDE9F0E084915E\n:10033000882399F090E0880F991FFC01EA57FF4F3E\n:10034000A591B49184589F4FFC01859194919FB7DA\n:10035000F8948C91822B8C939FBFC0E0D0E081E019\n:100360000E9470000E94DC0080E00E9470000E94E9\n:10037000DC002097A1F30E940000F1CFF894FFCF9A\n:00000001FF";
var data = fs.readFileSync('arduino-1.0.6/uno/Blink.cpp.hex', { encoding: 'utf8' });

var hex = intel_hex.parse(data).data;

//TODO standardize chip configs
//uno
var pageSize = 128;
var baud = 115200;
var delay1 = 1; //minimum is 2.5us, so anything over 1 fine?
var delay2 = 1;

var options = {
  devicecode:0,
  revision:0,
  progtype:0,
  parmode:0,
  polling:0,
  selftimed:0,
  lockbytes:0,
  fusebytes:0,
  flashpollval1:0,
  flashpollval2:0,
  eeprompollval1:0,
  eeprompollval2:0,
  pagesizehigh:0,
  pagesizelow:pageSize,
  eepromsizehigh:0,
  eepromsizelow:0,
  flashsize4:0,
  flashsize3:0,
  flashsize2:0,
  flashsize1:0
};

SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {

  	console.log("comname " + port.comName);
 
  	if(usbttyRE.test(port.comName))
  	{

			console.log("found");

			var serialPort = new SerialPort.SerialPort(port.comName, {
			  baudrate: 115200,
			  parser: SerialPort.parsers.raw
			}, false);

  		var programmer = new stk500(serialPort);

  		async.series([
  			function(cbdone){
  				programmer.connect(cbdone);
  			},
  			function(cbdone){
          programmer.reset(delay1, delay2, cbdone);
  			},
  			function(cbdone){
  				programmer.sync(3, cbdone);
  			},
  			function(cbdone){
  				programmer.setOptions(options, cbdone);
  			},
  			function(cbdone){
  				programmer.enterProgrammingMode(cbdone);
  			},
  			function(cbdone){
  				programmer.upload(hex, pageSize, cbdone);
  			},
  			function(cbdone){
  				programmer.exitProgrammingMode(cbdone);
  			},
  			function(cbdone){
  				programmer.disconnect(cbdone);
  			}
  		], function(error){
        if(error){
          console.log("finished programming with errors: " + error);
        }else{
          console.log("programing complete!");
        }
  		});

  	}

  });
});

