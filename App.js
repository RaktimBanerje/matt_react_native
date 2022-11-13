import React from 'react';
import Realm from "realm"
import NetInfo from "@react-native-community/netinfo";
import RNFetchBlob from 'rn-fetch-blob'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bars } from 'react-native-loader';
import { View, Text, ImageBackground, StatusBar, TextInput, Button } from 'react-native';

const App = () => {

    const [emailAddress, setEmailAddress] = React.useState("imreke_dev-eqocv+LOC1@imreke.com.au")
    const [passwordDetails, setPasswordDetails] = React.useState("3YQ9eyCYVQ6KbjH")
    const [keyvalue, setKeyValue] = React.useState(emailAddress.substring(0, emailAddress.indexOf("@")))
    const [login_email, setLoginEmail] = React.useState(emailAddress)
    const [login_db, setLoginDb] = React.useState(keyvalue.split('+')[0])
    const [login_locid, setLocId] = React.useState(keyvalue.split('+')[1])
    const [login_password, setLoginPassword] = React.useState(passwordDetails)


    const [isLoading, setLoading] = React.useState(false)
    const [isLogin, setIsLogin] = React.useState(false)
    const [isConnected, setIsConnected] = React.useState(false)
    const [slider_data, setSliderData] = React.useState(JSON.stringify([]))
    const [slides_downloaded, setSliderDownload] = React.useState(false)

    const [isSlideStarted, setIsSlideStarted] = React.useState(false)
    const [slide, setSlide] = React.useState()

    async function handleLogin() {
        const apprealm = new Realm.App({ id: login_db });
        const {currentUser} = apprealm;
        const credentials = Realm.Credentials.emailPassword(login_email, login_password);
        try {
          const user = await apprealm.logIn(credentials);
          console.assert(user.id === apprealm.currentUser.id);
          console.log("Successfully logged in!", user.id);
          await AsyncStorage.setItem("emailAddress", emailAddress)
          await AsyncStorage.setItem("passwordDetails", passwordDetails)
          return
        } catch (err) {
          console.error("Failed to log in", err.message);
          throw new Error("Failed to log in")
        }
    }

    async function getOrderListLength() {
      const MDSSchema = {
        name: "menu_board_layouts",
        properties: {
          _id: "objectId",
          boardid: "string",
          slider_image_urls: "string",
          slider_image_delays: "string"
        },
        primaryKey: "_id",
      };

      const apprealm = new Realm.App({ id: login_db });
      const { currentUser } = apprealm;
      console.log(currentUser);
      const OpenRealmBehaviorConfiguration = {
        type: "openImmediately",
      };

      let realmmds = await Realm.open({
        schema: [MDSSchema],
        path: "menu_board_layouts.realm",
        sync: {
          user: currentUser,
          partitionValue: "",
          newRealmFileBehavior: OpenRealmBehaviorConfiguration,
          existingRealmFileBehavior: OpenRealmBehaviorConfiguration,
        }
      })

      var sear = "1";
      const mdsdata = realmmds.objects("menu_board_layouts");
      const mdsfildata = mdsdata.filtered('boardid == "' + sear + '"');
      console.log(`Number of MDS objects: ${mdsfildata.length}`);

      if (mdsfildata.length == 0) {
        setTimeout(() => {
          handleLogin();
        }, 4000);

      } else {
        const mdsfilslidedata = mdsfildata;
        //alert(JSON.stringify(mdsfilslidedata));
        var a = [];
        var i,
          x = "";

        for (i in mdsfilslidedata) {
          a.push({
            slider_image_urls: `${mdsfilslidedata[i].slider_image_urls}`,
            slider_image_delays: `${mdsfilslidedata[i].slider_image_delays}`,
          });
        }
        console.log(JSON.stringify(a));
        setSliderData(JSON.stringify(a));

        mdsfildata.addListener(function (collection, changes) {
          console.log(changes.insertions);
          console.log(changes.modifications.length);
          console.log(changes.oldModifications);
          console.log(changes.newModifications.length);
          console.log(changes.deletions);

          if (changes.newModifications.length == "1") {
            getOrderListLength();
          }
          if (changes.newModifications.length == "0") {
            setLoading(true)

            if (isConnected) {
              let i;
              var getUrl = slider_data;
              obj = JSON.parse(getUrl);
              //  alert(obj.length);
              refreshDirectory()
              for (i = 0; i < obj.length; i++) {
                //  alert();
                downloadImage('https://appdevnew.imreke.com.au/uploads/board/' + mdsfilslidedata[i].slider_image_urls, mdsfilslidedata[i].slider_image_urls)
                  .then(console.log)
                  .catch(console.error);
              }
              if (i == obj.length) {
                console.log("slides_downloaded");
                setSliderDownload(true)
                setTimeout(() => {
                  initSlides();
                }, 10000);
              }
            } else {
              initSlides();
            }
          }
        });
      }
    }

    function refreshDirectory() {
       RNFetchBlob.fs.exists("/data/user/0/com.matt_react_native/files/images")
        .then((exist) => {
            if(exist){
                RNFetchBlob.fs.unlink('/data/user/0/com.matt_react_native/files/images')
                .then(() => {
                    RNFetchBlob.fs.mkdir("/data/user/0/com.matt_react_native/files/images")
                    .then(() => console.log)
                    .catch((err) => console.log)
                 })
                .catch((err) => { console.log })
            }
            else {
               RNFetchBlob.fs.mkdir("/data/user/0/com.matt_react_native/files/images")
                .then(() => console.log)
                .catch((err) => console.log)
            }
        })
    .catch(() => console.log)
    }

    async function downloadImage(url, name) {
      let dirs = RNFetchBlob.fs.dirs
      RNFetchBlob
        .config({
          fileCache : true,
          // by adding this option, the temp files will have a file extension
          path : dirs.DocumentDir + `/images/${name}`
        })
        .fetch('GET', url, {
          //some headers ..
        })
        .then((res) => {
          // the temp file path with file extension `png`
          console.log('The file saved to ', res.path())
          // Beware that when using a file path as Image source on Android,
          // you must prepend "file://"" before the file path
        })
        return
    }

    async function initSlides() {
        console.log(isConnected)
        console.log("Init Slides")
        setLoading(false)
        setIsSlideStarted(true)
        RNFetchBlob.fs.ls("/data/user/0/com.matt_react_native/files/images")
        // files will an array contains filenames
        .then(async (files) => {

            function timeout(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            const slides = JSON.parse(slider_data)
            console.log(slider_data)
            for(let i = 0 ; i < slides.length ; i++) {
                let wait = await timeout(Number(slides[i].slider_image_delays) * 1000)
                setSlide(data => 'file:///data/user/0/com.matt_react_native/files/images/' + slides[i].slider_image_urls)

                if(i == (slides.length - 1)) {
                    i = 0
                }
            }
        })
    }

    React.useEffect(() => {
        setIsSlideStarted(false)
        setLoading(true)

        NetInfo.addEventListener(state => {
          setIsConnected(state.isConnected)
        });

        handleLogin()
        .then(() => getOrderListLength())
    }, [])

    const styles = StyleSheet.create({
      input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
      },
    });

    const WelcomeScreen = () => {
      <View style={{flex: 1, alignItems: "center"}}>
        <Text>WELCOME TO IMREKE MDS</Text>
        <TextInput
          style={styles.input}
          onChangeText={setEmailAddress}
          placeholder={"Email Address"}
        />
        <TextInput
          style={styles.input}
          onChangeText={setPasswordDetails}
          placeholder={"Password"}
        />
        <Button
          onPress={handleLogin} 
          title="Login"
          color="black"
        />
      </View>
    }

    return (
        <>
            <StatusBar hidden={true} />
            <View style={{flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "grey"}}>
                {isLoading && <Bars size={22} color="white" />}
                {!isLoading && isSlideStarted && slide && (
                    <ImageBackground source={{uri: `${slide}`}} resizeMode="cover" style={{flex: 1, justifyContent: "center", height: "100%", width: "100%"}} />
                )}
            </View>
        </>
    )
}

export default App;
