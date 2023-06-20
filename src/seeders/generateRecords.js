const Record = require("../models/record.model");

exports.generateRecordsDataByFilter = async(minData, maxData, filter, sensorId, roomId) => {
    try {
        // const filter = "Today";
        // const minData = 23;
        // const maxData = 30;
        let interval, currentDateInterval;
        const currentDate = new Date();
        // let i = 0;
        console.log(`minData: ${minData}, maxData: ${maxData}, filter: ${filter}, sensorId: ${sensorId}, roomId: ${roomId}`);
        // while(i < 1){
            switch(filter){
                case "Today":
                    startDate = new Date(currentDate);
                    startDate.setHours(currentDate.getHours() - 23, 0, 0, 0);
                    endDate = new Date();
                    endDate.setHours(currentDate.getHours(), currentDate.getMinutes(), currentDate.getSeconds(), currentDate.getMilliseconds());
                    interval = 60; // Interval in minutes
    
                    currentDateInterval = new Date(startDate);
    
                    while (currentDateInterval <= endDate) {
                        const randomSensorValue = Math.random() * (Number(maxData) - Number(minData)) + Number(minData);
                        // recordTodayFilterSeeders(randomSensorValue, currentDate);
                        console.log(`add ${randomSensorValue} value at ${currentDateInterval}`);
                        await new Record({
                            sensorId: sensorId,
                            sensorData: randomSensorValue,
                            roomId: roomId,
                            date: currentDateInterval
                        }).save();
                        currentDateInterval.setMinutes(currentDateInterval.getMinutes() + interval);
                    }
                    break;
                case "Week":
                    startDate = new Date(currentDate);
                    startDate.setDate(currentDate.getDate() - currentDate.getDay());
                    endDate = new Date(currentDate);
                    endDate.setDate(startDate.getDate() + 6);
                    interval = 1; // Interval in days
    
                    currentDateInterval = new Date(startDate);
    
                    while (currentDateInterval <= endDate) {
                        const randomSensorValue = Math.random() * (Number(maxData) - Number(minData)) + Number(minData);
                        // recordTodayFilterSeeders(randomSensorValue, currentDate);
                        await new Record({
                            sensorId: sensorId,
                            sensorData: randomSensorValue,
                            roomId: roomId,
                            date: currentDateInterval
                        }).save();
                        currentDateInterval.setDate(currentDateInterval.getDate() + interval);
                    }
                    break;
            }
            // i++;
            // console.log("i: " + i);
        // }

    } catch (err) {
        console.log("err: " + err);
    }
}

// generateRecordsDataByFilter();