// JS assets for plugin enclosure
(function () {
    try {
        // source: plugin/enclosure/js/enclosure.js
        $(function () {
          function EnclosureViewModel(parameters) {
            var self = this;
        
            self.pluginName = "enclosure";
        
            self.settingsViewModel = parameters[0];
            self.connectionViewModel = parameters[1];
            self.printerStateViewModel = parameters[2];
        
            self.rpi_outputs = ko.observableArray();
            self.rpi_inputs = ko.observableArray();
        
            self.settingsOpen = false;
        
            self.settings_outputs_regular = ko.pureComputed(function () {
              return ko.utils.arrayFilter(self.settingsViewModel.settings.plugins.enclosure.rpi_outputs(), function (item) {
                return (item.output_type() === "regular" && !item.toggle_timer());
              });
            });
            
            self.settings_possible_outputs = ko.pureComputed(function () {
              return ko.utils.arrayFilter(self.settingsViewModel.settings.plugins.enclosure.rpi_outputs(), function (item) {
                return ((item.output_type() === "regular" && !item.toggle_timer()) || item.output_type() === "gcode_output" || item.output_type() === "shell_output");
              });
            });
        
            self.rpi_inputs_temperature_sensors = ko.pureComputed(function () {
              return ko.utils.arrayFilter(self.rpi_inputs(), function (item) {
                return (item.input_type() === "temperature_sensor");
              });
            });
        
            self.settings_temperature_sensors = ko.pureComputed(function () {
              return ko.utils.arrayFilter(self.settingsViewModel.settings.plugins.enclosure.rpi_inputs(), function (item) {
                return (item.input_type() === "temperature_sensor");
              });
            });
        
            self.settings_hum_sensors = ko.pureComputed(function () {
              return ko.utils.arrayFilter(self.settings_temperature_sensors(), function (sensor) {
                return (self.humidityCapableSensor(sensor.temp_sensor_type()));
              });
            });
        
            self.use_sudo = ko.observable();
            self.gcode_control = ko.observable();
            self.neopixel_dma = ko.observable();
            self.debug = ko.observable();
            self.debug_temperature_log = ko.observable();
            self.use_board_pin_number = ko.observable();
            self.filament_sensor_gcode = ko.observable();
            self.notification_provider = ko.observable();
            self.notification_event_name = ko.observable();
            self.notification_api_key = ko.observable();
            self.notifications = ko.observableArray([]);
        
            self.humidityCapableSensor = function(sensor){
              if (['11', '22', '2302', 'bme280', 'am2320', 'si7021'].indexOf(sensor) >= 0){
                return true;
              }
              return false;
            };
        
            self.isRegularOutput = function(index_id){
              return_value = false;
              if (typeof index_id != 'undefined'){
                self.settingsViewModel.settings.plugins.enclosure.rpi_outputs().forEach(function (output) {
                  if (output.index_id() == index_id && output.output_type() == "regular") {
                    return_value = true;
                    return false;
                  }
                });
              }
              return return_value;     
            };
        
            self.linkedTemperatureControl = function(sensor_index){
              return ko.pureComputed(function () {
                return ko.utils.arrayFilter(self.rpi_outputs(), function (item) {
                  if (item.linked_temp_sensor){
                    return (item.linked_temp_sensor() == sensor_index && item.output_type() == "temp_hum_control");
                  }else{
                    return false;
                  }
                });
              });
            };
        
            self.calculateRowSpan = function(index_id){
              span = self.linkedTemperatureControl(index_id())().length
              return span == 0 ? 1 : span;
            };
        
            self.hasAnySensorWithHumidity = function(){
              return_value = false;
              self.rpi_inputs_temperature_sensors().forEach(function (sensor) {
                if (self.humidityCapableSensor(sensor.temp_sensor_type())) {
                  return_value = true;
                  return false;
                }
              });      
              return return_value;
            };
        
            self.hasAnyNavbarOutput = function(){
              return_value = false;
              self.rpi_outputs().forEach(function (output) {
                if ((output.output_type()=="regular" || output.output_type()=="gcode_output") && output.show_on_navbar()) {
                  return_value = true;
                  return false;
                }
              });      
              return return_value;
            };
        
            self.hasAnyNavbarTemperature = function(){
              return_value = false;
              self.rpi_inputs_temperature_sensors().forEach(function (sensor) {
                if (sensor.temp_sensor_navbar()) {
                  return_value = true;
                  return false;
                }
              });      
              return return_value;
            };
        
            self.hasAnyTemperatureControl = function(){
              return_value = false
              self.rpi_outputs().forEach(function (output) {
                if (output.output_type()=="temp_hum_control") {
                  return_value = true
                  return false;
                } 
              });
              return return_value;
            };
        
            self.onDataUpdaterPluginMessage = function (plugin, data) {
        
              if (typeof plugin == 'undefined'){
                return;
              }
        
              if (plugin != "enclosure") {
                return;
              }
        
              if(self.settingsOpen){
                return;
              }
        
              if (data.hasOwnProperty("sensor_data")) {
                data.sensor_data.forEach(function (sensor_data) {
                  var linked_temp_sensor = ko.utils.arrayFilter(self.rpi_inputs_temperature_sensors(), function (temperature_sensor) {
                    return (sensor_data['index_id'] == temperature_sensor.index_id());
                  }).pop();
                  if (linked_temp_sensor){
                    linked_temp_sensor.temp_sensor_temp(sensor_data['temperature'])
                    linked_temp_sensor.temp_sensor_humidity(sensor_data['humidity'])
                  }
                })
              }
        
              if (data.hasOwnProperty("set_temperature")) {
                data.set_temperature.forEach(function (set_temperature) {
                  var linked_temp_control = ko.utils.arrayFilter(self.rpi_outputs(), function (temp_control) {
                    return (set_temperature['index_id'] == temp_control.index_id());
                  }).pop();
                  if (linked_temp_control) {
                    linked_temp_control.temp_ctr_set_value(set_temperature['set_temperature'])
                  }
                })
              }
        
              if (data.hasOwnProperty("rpi_output_regular")) {
                data.rpi_output_regular.forEach(function (output) {
                  var linked_output = ko.utils.arrayFilter(self.rpi_outputs(), function (item) {
                    return (output['index_id'] == item.index_id());
                  }).pop();
                  if (linked_output) {
                    linked_output.gpio_status(output['status'])
                    linked_output.auto_shutdown(output['auto_shutdown'])
                    linked_output.auto_startup(output['auto_startup'])
                  }
                })
              }
        
              if (data.hasOwnProperty("rpi_output_temp_hum_ctrl")) {
                data.rpi_output_temp_hum_ctrl.forEach(function (output) {
                  var linked_output = ko.utils.arrayFilter(self.rpi_outputs(), function (item) {
                    return (output['index_id'] == item.index_id());
                  }).pop();
                  if (linked_output) {
                    linked_output.gpio_status(output['status'])
                    linked_output.auto_shutdown(output['auto_shutdown'])
                    linked_output.auto_startup(output['auto_startup'])
                  }
                })
              }
        
              if (data.hasOwnProperty("rpi_output_pwm")) {
                data.rpi_output_pwm.forEach(function (output) {
                  var linked_output = ko.utils.arrayFilter(self.rpi_outputs(), function (item) {
                    return (output['index_id'] == item.index_id());
                  }).pop();
                  if (linked_output) {
                    linked_output.duty_cycle(output['pwm_value'])
                    linked_output.auto_shutdown(output['auto_shutdown'])
                    linked_output.auto_startup(output['auto_startup'])
                  }
                })
              }
        
              if (data.hasOwnProperty("rpi_output_neopixel")) {
                data.rpi_output_neopixel.forEach(function (output) {
                  var linked_output = ko.utils.arrayFilter(self.rpi_outputs(), function (item) {
                    return (output['index_id'] == item.index_id());
                  }).pop();
                  if (linked_output) {
                    linked_output.neopixel_color(output['color'])
                    linked_output.auto_shutdown(output['auto_shutdown'])
                    linked_output.auto_startup(output['auto_startup'])
                  }
                })
              }
        
              if (data.hasOwnProperty("rpi_output_ledstrip")) {
                data.rpi_output_ledstrip.forEach(function (output) {
                  var linked_output = ko.utils.arrayFilter(self.rpi_outputs(), function (item) {
                    return (output['index_id'] == item.index_id());
                  }).pop();
                  if (linked_output) {
                    linked_output.ledstrip_color(output['color'])
                    linked_output.auto_shutdown(output['auto_shutdown'])
                    linked_output.auto_startup(output['auto_startup'])
                  }
                })
              }
        
              if (data.hasOwnProperty("filament_sensor_status")) {
                data.filament_sensor_status.forEach(function (filament_sensor) {
                  var linked_filament_sensor = ko.utils.arrayFilter(self.rpi_inputs(), function (item) {
                    return (filament_sensor['index_id'] == item.index_id());
                  }).pop();
                  if (linked_filament_sensor) {
                    linked_filament_sensor.filament_sensor_enabled(filament_sensor['filament_sensor_enabled'])
                  }
                })
              }
        
              if (data.is_msg) {
                new PNotify({
                  title: "Enclosure",
                  text: data.msg,
                  type: data.msg_type
                });
              }
            };
        
            self.isUser = ko.computed(function () {
              return self.connectionViewModel.loginState.isUser();
            });
        
            self.isOperational = ko.computed(function () {
              return self.connectionViewModel.loginState.isUser() && self.printerStateViewModel.isOperational();
            });
        
        
            self.getCleanTemperature = function (temp) {
              if (temp === undefined || isNaN(parseFloat(temp))) return "-";
              if (temp < 10) return String("off");
              return temp;
            }
        
            self.getDutyCycle = function (duty_cycle) {    
              if (duty_cycle === undefined || isNaN(parseFloat(duty_cycle))) return "-";
              if (parseInt(duty_cycle) == 0) return String("off");
              return duty_cycle;
            }
        
            self.bindFromSettings = function(){
              self.rpi_outputs(self.settingsViewModel.settings.plugins.enclosure.rpi_outputs());
              self.rpi_inputs(self.settingsViewModel.settings.plugins.enclosure.rpi_inputs());
              self.use_sudo(self.settingsViewModel.settings.plugins.enclosure.use_sudo());
              self.gcode_control(self.settingsViewModel.settings.plugins.enclosure.gcode_control());
              self.neopixel_dma(self.settingsViewModel.settings.plugins.enclosure.neopixel_dma());
              self.debug(self.settingsViewModel.settings.plugins.enclosure.debug());
              self.debug_temperature_log(self.settingsViewModel.settings.plugins.enclosure.debug_temperature_log());
              self.use_board_pin_number(self.settingsViewModel.settings.plugins.enclosure.use_board_pin_number());
              self.filament_sensor_gcode(self.settingsViewModel.settings.plugins.enclosure.filament_sensor_gcode());
              self.notification_provider(self.settingsViewModel.settings.plugins.enclosure.notification_provider());
              self.notification_event_name(self.settingsViewModel.settings.plugins.enclosure.notification_event_name());
              self.notification_api_key(self.settingsViewModel.settings.plugins.enclosure.notification_api_key());
              self.notifications(self.settingsViewModel.settings.plugins.enclosure.notifications());
            };
        
            self.onBeforeBinding = function () {
              self.bindFromSettings();
            };
        
            self.onSettingsBeforeSave = function() {
              self.bindFromSettings();
            };
        
            self.onStartupComplete = function () {
              self.settingsOpen = false;
            };
        
            self.onSettingsShown = function () {
              self.settingsOpen = true;
            };
        
            self.showColorPicker = function () {
              $('[name=colorpicker]').colorpicker({
                format: 'rgb'
              });
            }
        
            self.onSettingsHidden = function () {
              self.showColorPicker();
              self.settingsOpen = false;
            };
        
            self.getRegularOutputs = function () {
              return self.rpi_outputs().filter(function (rpi_outputs) {
                return rpi_outputs.output_type == 'regular';
              });
            };
        
            self.setTemperature = function (item, form) {
        
              var newSetTemperature = item.temp_ctr_new_set_value();
              if (form !== undefined) {
                $(form).find("input").blur();
              }
        
              if(self.isNumeric(newSetTemperature)){
                var request = {set_temperature:newSetTemperature, index_id:item.index_id()};
        
                $.ajax({
                  url: self.buildPluginUrl("/setEnclosureTempHum"),
                  type: "GET",
                  dataType: "json",
                  data: request,
                  success: function (data) {         
                    item.temp_ctr_new_set_value("");
                    item.temp_ctr_set_value(newSetTemperature);
                    self.getUpdateUI();  
                  },
                  error: function (textStatus, errorThrown) {
                    new PNotify({
                      title: "Enclosure",
                      text: "Error setting temperature",
                      type: "error"
                    });
                }
                });
              }else{
                new PNotify({
                  title: "Enclosure",
                  text: "Invalid set temperature",
                  type: "error"
                });
              } 
            };
        
            self.addRpiOutput = function () {
        
              var arrRelaysLength = self.settingsViewModel.settings.plugins.enclosure.rpi_outputs().length;
        
              var nextIndex = arrRelaysLength == 0 ? 1 : self.settingsViewModel.settings.plugins.enclosure.rpi_outputs()[arrRelaysLength - 1].index_id() + 1;
        
              self.settingsViewModel.settings.plugins.enclosure.rpi_outputs.push({
                index_id: ko.observable(nextIndex),
                label: ko.observable("Ouput " + nextIndex),
                output_type: ko.observable("regular"),
                shell_script: ko.observable(""),
                gpio_pin: ko.observable(0),
                gpio_status: ko.observable(false),
                hide_btn_ui: ko.observable(false),
                active_low: ko.observable(true),
                pwm_temperature_linked: ko.observable(false),
                toggle_timer: ko.observable(false),
                toggle_timer_on: ko.observable(0),
                toggle_timer_off: ko.observable(0),
                startup_with_server: ko.observable(false),
                auto_startup: ko.observable(false),
                controlled_io: ko.observable(0),
                controlled_io_set_value: ko.observable("Low"),
                startup_time: ko.observable(0),
                auto_shutdown: ko.observable(false),
                shutdown_on_failed: ko.observable(false),
                shutdown_time: ko.observable(0),
                linked_temp_sensor: ko.observable(""),
                alarm_set_temp: ko.observable(0),
                temp_ctr_type: ko.observable("heater"),
                temp_ctr_deadband: ko.observable(0),
                temp_ctr_set_value: ko.observable(0),
                temp_ctr_new_set_value: ko.observable(""),
                temp_ctr_default_value: ko.observable(0),
                temp_ctr_max_temp: ko.observable(0),
                pwm_frequency: ko.observable(50),
                pwm_status: ko.observable(50),
                duty_cycle: ko.observable(0),
                duty_a: ko.observable(0),
                duty_b: ko.observable(0),
                temperature_a: ko.observable(0),
                temperature_b: ko.observable(0),
                default_duty_cycle: ko.observable(0),
                new_duty_cycle: ko.observable(""),
                neopixel_color: ko.observable("rgb(0,0,0)"),
                default_neopixel_color: ko.observable(""),
                new_neopixel_color: ko.observable(""),
                neopixel_count: ko.observable(0),
                neopixel_brightness: ko.observable(255),
                ledstrip_color: ko.observable("rgb(0,0,0)"),
                default_ledstrip_color: ko.observable(""),
                new_ledstrip_color: ko.observable(""),
                ledstrip_gpio_clk: ko.observable(""),
                ledstrip_gpio_dat: ko.observable(""),
                microcontroller_address: ko.observable(0),
                gcode: ko.observable(""),
                show_on_navbar: ko.observable(false)
              });
        
            };
        
            self.removeRpiOutput = function (data) {
              self.settingsViewModel.settings.plugins.enclosure.rpi_outputs.remove(data);
            };
        
            self.addRpiInput = function () {
        
              var arrRelaysLength = self.settingsViewModel.settings.plugins.enclosure.rpi_inputs().length;
        
              var nextIndex = arrRelaysLength == 0 ? 1 : self.settingsViewModel.settings.plugins.enclosure.rpi_inputs()[arrRelaysLength - 1].index_id() + 1;
        
              self.settingsViewModel.settings.plugins.enclosure.rpi_inputs.push({
                index_id: ko.observable(nextIndex),
                label: ko.observable("Input " + nextIndex),
                input_type: ko.observable("gpio"),
                gpio_pin: ko.observable(0),
                input_pull_resistor: ko.observable("input_pull_up"),
                temp_sensor_type: ko.observable("DS18B20"),
                temp_sensor_address: ko.observable(""),
                temp_sensor_temp: ko.observable(""),
                temp_sensor_humidity: ko.observable(""),
                ds18b20_serial: ko.observable(""),
                use_fahrenheit: ko.observable(false),
                action_type: ko.observable("output_control"),
                controlled_io: ko.observable(""),
                controlled_io_set_value: ko.observable("low"),
                edge: ko.observable("fall"),
                printer_action: ko.observable("filament"),
                temp_sensor_navbar: ko.observable(true),
                filament_sensor_timeout: ko.observable(120),
                filament_sensor_enabled: ko.observable(true)
              });
            };
        
            self.removeRpiInput = function (definition) {
              self.settingsViewModel.settings.plugins.enclosure.rpi_inputs.remove(definition);
            };
        
            self.turnOffHeater = function (item) {
              var request = { set_temperature: 0, index_id: item.index_id() };
              $.ajax({
                url: self.buildPluginUrl("/setEnclosureTempHum"),
                type: "GET",
                dataType: "json",
                data: request,
                success: function (data) {
                  self.getUpdateUI();  
                }
              });
            };
        
            self.clearGPIOMode = function () {
              $.ajax({
                url: self.buildPluginUrl("/clearGPIOMode"),
                type: "GET",
                dataType: "json",
                success: function (data) {
                  new PNotify({
                    title: "Enclosure",
                    text: "GPIO Mode cleared successfully",
                    type: "success"
                  });
                }
              });
            };
        
            self.getUpdateUI = function () {
              $.ajax({
                url: self.buildPluginUrl("/updateUI"),
                type: "GET"
              });
            };
        
            self.handleIO = function (item, form) {
        
              var request = {
                "status": !item.gpio_status(),
                "index_id": item.index_id()
              };
        
              $.ajax({
                type: "GET",
                dataType: "json",
                data: request,
                url: self.buildPluginUrl("/setIO"),
                success: function (data) {
                  self.getUpdateUI();
                }
              });
            };
        
            self.handleGcode = function (item, form) {
              var request = {
                "index_id": item.index_id()
              };
        
              $.ajax({
                type: "GET",
                dataType: "json",
                data: request,
                url: self.buildPluginUrl("/sendGcodeCommand")
              });
            };
        
            self.handleShellOutput = function (item, form) {
              var request = {
                "index_id": item.index_id()
              };
        
              $.ajax({
                type: "GET",
                dataType: "json",
                data: request,
                url: self.buildPluginUrl("/sendShellCommand")
              });
            };
        
            self.switchAutoStartUp = function (item) {
        
              var request = {
                "status": !item.auto_startup(),
                "index_id": item.index_id()
              };
              $.ajax({
                type: "GET",
                dataType: "json",
                data: request,
                url: self.buildPluginUrl("/setAutoStartUp"),
                success: function (data) {
                  self.getUpdateUI();
                }
              });
            };
        
            self.switchAutoShutdown = function (item) {
              var request = {
                "status": !item.auto_shutdown(),
                "index_id": item.index_id()
              };
              $.ajax({
                type: "GET",
                dataType: "json",
                data: request,
                url: self.buildPluginUrl("/setAutoShutdown"),
                success: function (data) {
                  self.getUpdateUI();
                }
              });
            };
        
            self.switchFilamentSensor = function (item) {
              var request = {
                "status": !item.filament_sensor_enabled(),
                "index_id": item.index_id()
              };
              $.ajax({
                type: "GET",
                dataType: "json",
                data: request,
                url: self.buildPluginUrl("/setFilamentSensor"),
                success: function (data) {
                  self.getUpdateUI();
                }
              });
            };
        
            self.handlePWM = function (item) {
              var pwm_value = item.new_duty_cycle();
        
              pwm_value = parseInt(pwm_value);
        
              if (pwm_value < 0 || pwm_value > 100 || isNaN(pwm_value)) {
                item.new_duty_cycle("")
                new PNotify({
                  title: "Enclosure",
                  text: "Duty Cycle value needs to be between 0 and 100!",
                  type: "error"
                });
              } else {
                var request = { new_duty_cycle: pwm_value, index_id: item.index_id() };
                $.ajax({
                  type: "GET",
                  dataType: "json",
                  data: request,
                  url: self.buildPluginUrl("/setPWM"),
                  success: function (data) {
                    item.new_duty_cycle("");
                    item.duty_cycle(pwm_value);
                    self.getUpdateUI();
                  }
                });
              }
            };
        
            self.handleNeopixel = function (item) {
        
              var index = item.index_id() ;
              var or_tempStr = item.new_neopixel_color();
              var tempStr = or_tempStr.replace("rgb(", "");
        
              var r = parseInt(tempStr.substring(0, tempStr.indexOf(",")));
              tempStr = tempStr.slice(tempStr.indexOf(",") + 1);
              var g = parseInt(tempStr.substring(0, tempStr.indexOf(",")));
              tempStr = tempStr.slice(tempStr.indexOf(",") + 1);
              var b = parseInt(tempStr.substring(0, tempStr.indexOf(")")));
        
              if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || isNaN(r) || isNaN(g) || isNaN(b)) {
                new PNotify({
                  title: "Enclosure",
                  text: "Color needs to follow the format rgb(value_red,value_green,value_blue)!",
                  type: "error"
                });
              } else {
                $.ajax({
                  type: "GET",
                  dataType: "json",
                  data: {
                    "index_id": index,
                    "red": r,
                    "green": g,
                    "blue": b
                  },
                  url: self.buildPluginUrl("/setNeopixel"),
                  success: function (data) {
                    item.new_neopixel_color("");
                    self.getUpdateUI();
                  }
                });
              }
            };
        
            self.handleLedstripColor = function (item) {
              var index = item.index_id() ;
              var or_tempStr = item.new_ledstrip_color();
              var tempStr = or_tempStr.replace("rgb(", "");
        
              var r = parseInt(tempStr.substring(0, tempStr.indexOf(",")));
              tempStr = tempStr.slice(tempStr.indexOf(",") + 1);
              var g = parseInt(tempStr.substring(0, tempStr.indexOf(",")));
              tempStr = tempStr.slice(tempStr.indexOf(",") + 1);
              var b = parseInt(tempStr.substring(0, tempStr.indexOf(")")));
              if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255 || isNaN(r) || isNaN(g) || isNaN(b)) {
                new PNotify({
                  title: "Enclosure",
                  text: "Color needs to follow the format rgb(value_red,value_green,value_blue)!",
                  type: "error"
                });
              } else {
                $.ajax({
                  type: "GET",
                  dataType: "json",
                  data: {
                    "index_id": index,
                    "rgb": or_tempStr
                  },
                  url: self.buildPluginUrl("/setLedstripColor"),
                  success: function (data) {
                    item.new_ledstrip_color("");
                    self.getUpdateUI();
                  }
                });
              }
            };
        
            self.isNumeric = function (n) {
              return !isNaN(parseFloat(n)) && isFinite(n);
            };
        
            self.buildPluginUrl = function (path) {
              return window.PLUGIN_BASEURL + self.pluginName + path;
            };
          }
        
          OCTOPRINT_VIEWMODELS.push({
            construct: EnclosureViewModel,
            // ViewModels your plugin depends on, e.g. loginStateViewModel, settingsViewModel, ...
            dependencies: ["settingsViewModel", "connectionViewModel", "printerStateViewModel"],
            // Elements to bind to, e.g. #settings_plugin_tasmota-mqtt, #tab_plugin_tasmota-mqtt, ...
            elements: ["#tab_plugin_enclosure", "#settings_plugin_enclosure", "#navbar_plugin_enclosure_1", "#navbar_plugin_enclosure_2"]
          });
        
        });
        ;
        
        // source: plugin/enclosure/js/bootstrap-colorpicker.min.js
        /*!
         * Bootstrap Colorpicker v2.5.1
         * https://itsjavi.com/bootstrap-colorpicker/
         */
        !function(a,b){"function"==typeof define&&define.amd?define(["jquery"],function(a){return b(a)}):"object"==typeof exports?module.exports=b(require("jquery")):jQuery&&!jQuery.fn.colorpicker&&b(jQuery)}(this,function(a){"use strict";var b=function(c,d,e,f,g){this.fallbackValue=e?e&&"undefined"!=typeof e.h?e:this.value={h:0,s:0,b:0,a:1}:null,this.fallbackFormat=f?f:"rgba",this.hexNumberSignPrefix=g===!0,this.value=this.fallbackValue,this.origFormat=null,this.predefinedColors=d?d:{},this.colors=a.extend({},b.webColors,this.predefinedColors),c&&("undefined"!=typeof c.h?this.value=c:this.setColor(String(c))),this.value||(this.value={h:0,s:0,b:0,a:1})};b.webColors={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"00ffff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000000",blanchedalmond:"ffebcd",blue:"0000ff",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"00ffff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"ff00ff",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgrey:"d3d3d3",lightgreen:"90ee90",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"778899",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"00ff00",limegreen:"32cd32",linen:"faf0e6",magenta:"ff00ff",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370d8",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"d87093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",red:"ff0000",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"ffffff",whitesmoke:"f5f5f5",yellow:"ffff00",yellowgreen:"9acd32",transparent:"transparent"},b.prototype={constructor:b,colors:{},predefinedColors:{},getValue:function(){return this.value},setValue:function(a){this.value=a},_sanitizeNumber:function(a){return"number"==typeof a?a:isNaN(a)||null===a||""===a||void 0===a?1:""===a?0:"undefined"!=typeof a.toLowerCase?(a.match(/^\./)&&(a="0"+a),Math.ceil(100*parseFloat(a))/100):1},isTransparent:function(a){return!(!a||!("string"==typeof a||a instanceof String))&&(a=a.toLowerCase().trim(),"transparent"===a||a.match(/#?00000000/)||a.match(/(rgba|hsla)\(0,0,0,0?\.?0\)/))},rgbaIsTransparent:function(a){return 0===a.r&&0===a.g&&0===a.b&&0===a.a},setColor:function(a){if(a=a.toLowerCase().trim()){if(this.isTransparent(a))return this.value={h:0,s:0,b:0,a:0},!0;var b=this.parse(a);b?(this.value=this.value={h:b.h,s:b.s,b:b.b,a:b.a},this.origFormat||(this.origFormat=b.format)):this.fallbackValue&&(this.value=this.fallbackValue)}return!1},setHue:function(a){this.value.h=1-a},setSaturation:function(a){this.value.s=a},setBrightness:function(a){this.value.b=1-a},setAlpha:function(a){this.value.a=Math.round(parseInt(100*(1-a),10)/100*100)/100},toRGB:function(a,b,c,d){0===arguments.length&&(a=this.value.h,b=this.value.s,c=this.value.b,d=this.value.a),a*=360;var e,f,g,h,i;return a=a%360/60,i=c*b,h=i*(1-Math.abs(a%2-1)),e=f=g=c-i,a=~~a,e+=[i,h,0,0,h,i][a],f+=[h,i,i,h,0,0][a],g+=[0,0,h,i,i,h][a],{r:Math.round(255*e),g:Math.round(255*f),b:Math.round(255*g),a:d}},toHex:function(a,b,c,d){0===arguments.length&&(a=this.value.h,b=this.value.s,c=this.value.b,d=this.value.a);var e=this.toRGB(a,b,c,d);if(this.rgbaIsTransparent(e))return"transparent";var f=(this.hexNumberSignPrefix?"#":"")+((1<<24)+(parseInt(e.r)<<16)+(parseInt(e.g)<<8)+parseInt(e.b)).toString(16).slice(1);return f},toHSL:function(a,b,c,d){0===arguments.length&&(a=this.value.h,b=this.value.s,c=this.value.b,d=this.value.a);var e=a,f=(2-b)*c,g=b*c;return g/=f>0&&f<=1?f:2-f,f/=2,g>1&&(g=1),{h:isNaN(e)?0:e,s:isNaN(g)?0:g,l:isNaN(f)?0:f,a:isNaN(d)?0:d}},toAlias:function(a,b,c,d){var e,f=0===arguments.length?this.toHex():this.toHex(a,b,c,d),g="alias"===this.origFormat?f:this.toString(this.origFormat,!1);for(var h in this.colors)if(e=this.colors[h].toLowerCase().trim(),e===f||e===g)return h;return!1},RGBtoHSB:function(a,b,c,d){a/=255,b/=255,c/=255;var e,f,g,h;return g=Math.max(a,b,c),h=g-Math.min(a,b,c),e=0===h?null:g===a?(b-c)/h:g===b?(c-a)/h+2:(a-b)/h+4,e=(e+360)%6*60/360,f=0===h?0:h/g,{h:this._sanitizeNumber(e),s:f,b:g,a:this._sanitizeNumber(d)}},HueToRGB:function(a,b,c){return c<0?c+=1:c>1&&(c-=1),6*c<1?a+(b-a)*c*6:2*c<1?b:3*c<2?a+(b-a)*(2/3-c)*6:a},HSLtoRGB:function(a,b,c,d){b<0&&(b=0);var e;e=c<=.5?c*(1+b):c+b-c*b;var f=2*c-e,g=a+1/3,h=a,i=a-1/3,j=Math.round(255*this.HueToRGB(f,e,g)),k=Math.round(255*this.HueToRGB(f,e,h)),l=Math.round(255*this.HueToRGB(f,e,i));return[j,k,l,this._sanitizeNumber(d)]},parse:function(b){if(0===arguments.length)return!1;var c,d,e=this,f=!1,g="undefined"!=typeof this.colors[b];return g&&(b=this.colors[b].toLowerCase().trim()),a.each(this.stringParsers,function(a,h){var i=h.re.exec(b);return c=i&&h.parse.apply(e,[i]),!c||(f={},d=g?"alias":h.format?h.format:e.getValidFallbackFormat(),f=d.match(/hsla?/)?e.RGBtoHSB.apply(e,e.HSLtoRGB.apply(e,c)):e.RGBtoHSB.apply(e,c),f instanceof Object&&(f.format=d),!1)}),f},getValidFallbackFormat:function(){var a=["rgba","rgb","hex","hsla","hsl"];return this.origFormat&&a.indexOf(this.origFormat)!==-1?this.origFormat:this.fallbackFormat&&a.indexOf(this.fallbackFormat)!==-1?this.fallbackFormat:"rgba"},toString:function(a,c){a=a||this.origFormat||this.fallbackFormat,c=c||!1;var d=!1;switch(a){case"rgb":return d=this.toRGB(),this.rgbaIsTransparent(d)?"transparent":"rgb("+d.r+","+d.g+","+d.b+")";case"rgba":return d=this.toRGB(),"rgba("+d.r+","+d.g+","+d.b+","+d.a+")";case"hsl":return d=this.toHSL(),"hsl("+Math.round(360*d.h)+","+Math.round(100*d.s)+"%,"+Math.round(100*d.l)+"%)";case"hsla":return d=this.toHSL(),"hsla("+Math.round(360*d.h)+","+Math.round(100*d.s)+"%,"+Math.round(100*d.l)+"%,"+d.a+")";case"hex":return this.toHex();case"alias":return d=this.toAlias(),d===!1?this.toString(this.getValidFallbackFormat()):c&&!(d in b.webColors)&&d in this.predefinedColors?this.predefinedColors[d]:d;default:return d}},stringParsers:[{re:/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*?\)/,format:"rgb",parse:function(a){return[a[1],a[2],a[3],1]}},{re:/rgb\(\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*?\)/,format:"rgb",parse:function(a){return[2.55*a[1],2.55*a[2],2.55*a[3],1]}},{re:/rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)/,format:"rgba",parse:function(a){return[a[1],a[2],a[3],a[4]]}},{re:/rgba\(\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)/,format:"rgba",parse:function(a){return[2.55*a[1],2.55*a[2],2.55*a[3],a[4]]}},{re:/hsl\(\s*(\d*(?:\.\d+)?)\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*?\)/,format:"hsl",parse:function(a){return[a[1]/360,a[2]/100,a[3]/100,a[4]]}},{re:/hsla\(\s*(\d*(?:\.\d+)?)\s*,\s*(\d*(?:\.\d+)?)\%\s*,\s*(\d*(?:\.\d+)?)\%\s*(?:,\s*(\d*(?:\.\d+)?)\s*)?\)/,format:"hsla",parse:function(a){return[a[1]/360,a[2]/100,a[3]/100,a[4]]}},{re:/#?([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/,format:"hex",parse:function(a){return[parseInt(a[1],16),parseInt(a[2],16),parseInt(a[3],16),1]}},{re:/#?([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/,format:"hex",parse:function(a){return[parseInt(a[1]+a[1],16),parseInt(a[2]+a[2],16),parseInt(a[3]+a[3],16),1]}}],colorNameToHex:function(a){return"undefined"!=typeof this.colors[a.toLowerCase()]&&this.colors[a.toLowerCase()]}};var c={horizontal:!1,inline:!1,color:!1,format:!1,input:"input",container:!1,component:".add-on, .input-group-addon",fallbackColor:!1,fallbackFormat:"hex",hexNumberSignPrefix:!0,sliders:{saturation:{maxLeft:100,maxTop:100,callLeft:"setSaturation",callTop:"setBrightness"},hue:{maxLeft:0,maxTop:100,callLeft:!1,callTop:"setHue"},alpha:{maxLeft:0,maxTop:100,callLeft:!1,callTop:"setAlpha"}},slidersHorz:{saturation:{maxLeft:100,maxTop:100,callLeft:"setSaturation",callTop:"setBrightness"},hue:{maxLeft:100,maxTop:0,callLeft:"setHue",callTop:!1},alpha:{maxLeft:100,maxTop:0,callLeft:"setAlpha",callTop:!1}},template:'<div class="colorpicker dropdown-menu"><div class="colorpicker-saturation"><i><b></b></i></div><div class="colorpicker-hue"><i></i></div><div class="colorpicker-alpha"><i></i></div><div class="colorpicker-color"><div /></div><div class="colorpicker-selectors"></div></div>',align:"right",customClass:null,colorSelectors:null},d=function(b,d){this.element=a(b).addClass("colorpicker-element"),this.options=a.extend(!0,{},c,this.element.data(),d),this.component=this.options.component,this.component=this.component!==!1&&this.element.find(this.component),this.component&&0===this.component.length&&(this.component=!1),this.container=this.options.container===!0?this.element:this.options.container,this.container=this.container!==!1&&a(this.container),this.input=this.element.is("input")?this.element:!!this.options.input&&this.element.find(this.options.input),this.input&&0===this.input.length&&(this.input=!1),this.color=this.createColor(this.options.color!==!1?this.options.color:this.getValue()),this.format=this.options.format!==!1?this.options.format:this.color.origFormat,this.options.color!==!1&&(this.updateInput(this.color),this.updateData(this.color));var e=this.picker=a(this.options.template);if(this.options.customClass&&e.addClass(this.options.customClass),this.options.inline?e.addClass("colorpicker-inline colorpicker-visible"):e.addClass("colorpicker-hidden"),this.options.horizontal&&e.addClass("colorpicker-horizontal"),["rgba","hsla","alias"].indexOf(this.format)===-1&&this.options.format!==!1&&"transparent"!==this.getValue()||e.addClass("colorpicker-with-alpha"),"right"===this.options.align&&e.addClass("colorpicker-right"),this.options.inline===!0&&e.addClass("colorpicker-no-arrow"),this.options.colorSelectors){var f=this,g=f.picker.find(".colorpicker-selectors");g.length>0&&(a.each(this.options.colorSelectors,function(b,c){var d=a("<i />").addClass("colorpicker-selectors-color").css("background-color",c).data("class",b).data("alias",b);d.on("mousedown.colorpicker touchstart.colorpicker",function(b){b.preventDefault(),f.setValue("alias"===f.format?a(this).data("alias"):a(this).css("background-color"))}),g.append(d)}),g.show().addClass("colorpicker-visible"))}e.on("mousedown.colorpicker touchstart.colorpicker",a.proxy(function(a){a.target===a.currentTarget&&a.preventDefault()},this)),e.find(".colorpicker-saturation, .colorpicker-hue, .colorpicker-alpha").on("mousedown.colorpicker touchstart.colorpicker",a.proxy(this.mousedown,this)),e.appendTo(this.container?this.container:a("body")),this.input!==!1&&(this.input.on({"keyup.colorpicker":a.proxy(this.keyup,this)}),this.input.on({"change.colorpicker":a.proxy(this.change,this)}),this.component===!1&&this.element.on({"focus.colorpicker":a.proxy(this.show,this)}),this.options.inline===!1&&this.element.on({"focusout.colorpicker":a.proxy(this.hide,this)})),this.component!==!1&&this.component.on({"click.colorpicker":a.proxy(this.show,this)}),this.input===!1&&this.component===!1&&this.element.on({"click.colorpicker":a.proxy(this.show,this)}),this.input!==!1&&this.component!==!1&&"color"===this.input.attr("type")&&this.input.on({"click.colorpicker":a.proxy(this.show,this),"focus.colorpicker":a.proxy(this.show,this)}),this.update(),a(a.proxy(function(){this.element.trigger("create")},this))};d.Color=b,d.prototype={constructor:d,destroy:function(){this.picker.remove(),this.element.removeData("colorpicker","color").off(".colorpicker"),this.input!==!1&&this.input.off(".colorpicker"),this.component!==!1&&this.component.off(".colorpicker"),this.element.removeClass("colorpicker-element"),this.element.trigger({type:"destroy"})},reposition:function(){if(this.options.inline!==!1||this.options.container)return!1;var a=this.container&&this.container[0]!==window.document.body?"position":"offset",b=this.component||this.element,c=b[a]();"right"===this.options.align&&(c.left-=this.picker.outerWidth()-b.outerWidth()),this.picker.css({top:c.top+b.outerHeight(),left:c.left})},show:function(b){this.isDisabled()||(this.picker.addClass("colorpicker-visible").removeClass("colorpicker-hidden"),this.reposition(),a(window).on("resize.colorpicker",a.proxy(this.reposition,this)),!b||this.hasInput()&&"color"!==this.input.attr("type")||b.stopPropagation&&b.preventDefault&&(b.stopPropagation(),b.preventDefault()),!this.component&&this.input||this.options.inline!==!1||a(window.document).on({"mousedown.colorpicker":a.proxy(this.hide,this)}),this.element.trigger({type:"showPicker",color:this.color}))},hide:function(b){return("undefined"==typeof b||!b.target||!(a(b.currentTarget).parents(".colorpicker").length>0||a(b.target).parents(".colorpicker").length>0))&&(this.picker.addClass("colorpicker-hidden").removeClass("colorpicker-visible"),a(window).off("resize.colorpicker",this.reposition),a(window.document).off({"mousedown.colorpicker":this.hide}),this.update(),void this.element.trigger({type:"hidePicker",color:this.color}))},updateData:function(a){return a=a||this.color.toString(this.format,!1),this.element.data("color",a),a},updateInput:function(a){return a=a||this.color.toString(this.format,!1),this.input!==!1&&(this.input.prop("value",a),this.input.trigger("change")),a},updatePicker:function(a){"undefined"!=typeof a&&(this.color=this.createColor(a));var b=this.options.horizontal===!1?this.options.sliders:this.options.slidersHorz,c=this.picker.find("i");if(0!==c.length)return this.options.horizontal===!1?(b=this.options.sliders,c.eq(1).css("top",b.hue.maxTop*(1-this.color.value.h)).end().eq(2).css("top",b.alpha.maxTop*(1-this.color.value.a))):(b=this.options.slidersHorz,c.eq(1).css("left",b.hue.maxLeft*(1-this.color.value.h)).end().eq(2).css("left",b.alpha.maxLeft*(1-this.color.value.a))),c.eq(0).css({top:b.saturation.maxTop-this.color.value.b*b.saturation.maxTop,left:this.color.value.s*b.saturation.maxLeft}),this.picker.find(".colorpicker-saturation").css("backgroundColor",(this.options.hexNumberSignPrefix?"":"#")+this.color.toHex(this.color.value.h,1,1,1)),this.picker.find(".colorpicker-alpha").css("backgroundColor",(this.options.hexNumberSignPrefix?"":"#")+this.color.toHex()),this.picker.find(".colorpicker-color, .colorpicker-color div").css("backgroundColor",this.color.toString(this.format,!0)),a},updateComponent:function(a){var b;if(b="undefined"!=typeof a?this.createColor(a):this.color,this.component!==!1){var c=this.component.find("i").eq(0);c.length>0?c.css({backgroundColor:b.toString(this.format,!0)}):this.component.css({backgroundColor:b.toString(this.format,!0)})}return b.toString(this.format,!1)},update:function(a){var b;return this.getValue(!1)===!1&&a!==!0||(b=this.updateComponent(),this.updateInput(b),this.updateData(b),this.updatePicker()),b},setValue:function(a){this.color=this.createColor(a),this.update(!0),this.element.trigger({type:"changeColor",color:this.color,value:a})},createColor:function(a){return new b(a?a:null,this.options.colorSelectors,this.options.fallbackColor?this.options.fallbackColor:this.color,this.options.fallbackFormat,this.options.hexNumberSignPrefix)},getValue:function(a){a="undefined"==typeof a?this.options.fallbackColor:a;var b;return b=this.hasInput()?this.input.val():this.element.data("color"),void 0!==b&&""!==b&&null!==b||(b=a),b},hasInput:function(){return this.input!==!1},isDisabled:function(){return!!this.hasInput()&&this.input.prop("disabled")===!0},disable:function(){return!!this.hasInput()&&(this.input.prop("disabled",!0),this.element.trigger({type:"disable",color:this.color,value:this.getValue()}),!0)},enable:function(){return!!this.hasInput()&&(this.input.prop("disabled",!1),this.element.trigger({type:"enable",color:this.color,value:this.getValue()}),!0)},currentSlider:null,mousePointer:{left:0,top:0},mousedown:function(b){!b.pageX&&!b.pageY&&b.originalEvent&&b.originalEvent.touches&&(b.pageX=b.originalEvent.touches[0].pageX,b.pageY=b.originalEvent.touches[0].pageY),b.stopPropagation(),b.preventDefault();var c=a(b.target),d=c.closest("div"),e=this.options.horizontal?this.options.slidersHorz:this.options.sliders;if(!d.is(".colorpicker")){if(d.is(".colorpicker-saturation"))this.currentSlider=a.extend({},e.saturation);else if(d.is(".colorpicker-hue"))this.currentSlider=a.extend({},e.hue);else{if(!d.is(".colorpicker-alpha"))return!1;this.currentSlider=a.extend({},e.alpha)}var f=d.offset();this.currentSlider.guide=d.find("i")[0].style,this.currentSlider.left=b.pageX-f.left,this.currentSlider.top=b.pageY-f.top,this.mousePointer={left:b.pageX,top:b.pageY},a(window.document).on({"mousemove.colorpicker":a.proxy(this.mousemove,this),"touchmove.colorpicker":a.proxy(this.mousemove,this),"mouseup.colorpicker":a.proxy(this.mouseup,this),"touchend.colorpicker":a.proxy(this.mouseup,this)}).trigger("mousemove")}return!1},mousemove:function(a){!a.pageX&&!a.pageY&&a.originalEvent&&a.originalEvent.touches&&(a.pageX=a.originalEvent.touches[0].pageX,a.pageY=a.originalEvent.touches[0].pageY),a.stopPropagation(),a.preventDefault();var b=Math.max(0,Math.min(this.currentSlider.maxLeft,this.currentSlider.left+((a.pageX||this.mousePointer.left)-this.mousePointer.left))),c=Math.max(0,Math.min(this.currentSlider.maxTop,this.currentSlider.top+((a.pageY||this.mousePointer.top)-this.mousePointer.top)));return this.currentSlider.guide.left=b+"px",this.currentSlider.guide.top=c+"px",this.currentSlider.callLeft&&this.color[this.currentSlider.callLeft].call(this.color,b/this.currentSlider.maxLeft),this.currentSlider.callTop&&this.color[this.currentSlider.callTop].call(this.color,c/this.currentSlider.maxTop),this.options.format!==!1||"setAlpha"!==this.currentSlider.callTop&&"setAlpha"!==this.currentSlider.callLeft||(1!==this.color.value.a?(this.format="rgba",this.color.origFormat="rgba"):(this.format="hex",this.color.origFormat="hex")),this.update(!0),this.element.trigger({type:"changeColor",color:this.color}),!1},mouseup:function(b){return b.stopPropagation(),b.preventDefault(),a(window.document).off({"mousemove.colorpicker":this.mousemove,"touchmove.colorpicker":this.mousemove,"mouseup.colorpicker":this.mouseup,"touchend.colorpicker":this.mouseup}),!1},change:function(a){this.keyup(a)},keyup:function(a){38===a.keyCode?(this.color.value.a<1&&(this.color.value.a=Math.round(100*(this.color.value.a+.01))/100),this.update(!0)):40===a.keyCode?(this.color.value.a>0&&(this.color.value.a=Math.round(100*(this.color.value.a-.01))/100),this.update(!0)):(this.color=this.createColor(this.input.val()),this.color.origFormat&&this.options.format===!1&&(this.format=this.color.origFormat),this.getValue(!1)!==!1&&(this.updateData(),this.updateComponent(),this.updatePicker())),this.element.trigger({type:"changeColor",color:this.color,value:this.input.val()})}},a.colorpicker=d,a.fn.colorpicker=function(b){var c=Array.prototype.slice.call(arguments,1),e=1===this.length,f=null,g=this.each(function(){var e=a(this),g=e.data("colorpicker"),h="object"==typeof b?b:{};g||(g=new d(this,h),e.data("colorpicker",g)),"string"==typeof b?a.isFunction(g[b])?f=g[b].apply(g,c):(c.length&&(g[b]=c[0]),f=g[b]):f=e});return e?f:g},a.fn.colorpicker.constructor=d});
        ;
        
    } catch (error) {
        log.error("Error in JS assets for plugin enclosure:", (error.stack || error));
    }
})();

// JS assets for plugin helloworld
(function () {
    try {
        // source: plugin/helloworld/js/helloworld.js
        /*
         * View model for OctoPrint-Helloworld
         *
         * Author: Raymond de Hooge
         * License: AGPLv3
         */
        $(function() {
            function HelloworldViewModel(parameters) {
                var self = this;
        
                // assign the injected parameters, e.g.:
                // self.loginStateViewModel = parameters[0];
                // self.settingsViewModel = parameters[1];
        
                // TODO: Implement your plugin's view model here.
            }
        
            /* view model class, parameters for constructor, container to bind to
             * Please see http://docs.octoprint.org/en/master/plugins/viewmodels.html#registering-custom-viewmodels for more details
             * and a full list of the available options.
             */
            OCTOPRINT_VIEWMODELS.push({
                construct: HelloworldViewModel,
                // ViewModels your plugin depends on, e.g. loginStateViewModel, settingsViewModel, ...
                dependencies: [ /* "loginStateViewModel", "settingsViewModel" */ ],
                // Elements to bind to, e.g. #settings_plugin_helloworld, #tab_plugin_helloworld, ...
                elements: [ /* ... */ ]
            });
        });
        
        ;
        
    } catch (error) {
        log.error("Error in JS assets for plugin helloworld:", (error.stack || error));
    }
})();
