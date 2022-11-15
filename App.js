import React from 'react';
import Realm from "realm"
import NetInfo from "@react-native-community/netinfo";
import RNFetchBlob from 'rn-fetch-blob'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bars } from 'react-native-loader';
import { View, Text, ImageBackground, StatusBar, TextInput, Button, StyleSheet, ScrollView } from 'react-native';

const App = () => {

  // "imreke_dev-eqocv+LOC1@imreke.com.au"
  // "3YQ9eyCYVQ6KbjH"
    const [emailAddress, setEmailAddress] = React.useState(null)
    const [passwordDetails, setPasswordDetails] = React.useState(null)

    const [keyvalue, setKeyValue] = React.useState("")
    const [login_email, setLoginEmail] = React.useState("")
    const [login_db, setLoginDb] = React.useState("")
    const [login_locid, setLocId] = React.useState("")
    const [login_password, setLoginPassword] = React.useState("")

    const [showForm, setShowForm] = React.useState(false)
    const [isLoading, setLoading] = React.useState(false)
    const [isLogin, setIsLogin] = React.useState(false)
    const [isConnected, setIsConnected] = React.useState(false)
    const [isError, setIsError] = React.useState("")
    // const [slider_data, setSliderData] = React.useState(JSON.stringify([]))
    let slider_data = []
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
          return
        } catch (err) {
          console.error("Failed to log in", err.message);
          if(err.message == "Network request failed" || err.message == "Aborted") {
            setIsConnected(false)
            getOrderListLength()
          }
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
        console.log("Slider Data")
        console.log(JSON.stringify(a));
        // setSliderData(a => JSON.stringify(a));
        slider_data = JSON.stringify(a)

        mdsfildata.addListener(function (collection, changes) {
          // console.log(changes.insertions);
          // console.log(changes.modifications.length);
          // console.log(changes.oldModifications);
          // console.log(changes.newModifications.length);
          // console.log(changes.deletions);

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
              console.log("refreshing directory")
              console.log(obj.length)
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
      console.log("Downloading...")
      console.log(name)
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
        RNFetchBlob.fs.ls("/data/user/0/com.matt_react_native/files/images")
        // files will an array contains filenames
        .then(async (files) => {
          setLoading(false)
          setIsSlideStarted(true)

            function timeout(ms) {
                return new Promise(resolve => setTimeout(resolve, ms));
            }

            const slides = JSON.parse(slider_data)

            for(let i = 0 ; i < slides.length ; i++) {
              console.log(slides[i].slider_image_urls)
              setSlide(data => 'file:///data/user/0/com.matt_react_native/files/images/' + slides[i].slider_image_urls)
              await timeout(Number(slides[i].slider_image_delays) * 1000)  

              if(i == (slides.length - 1)) {
                i = 0
              }
            }
        })
    }

    React.useEffect(() => {        
        NetInfo.addEventListener(state => {
          setIsConnected(prev => state.isInternetReachable)
        });

        // handleLogin()
        // .then(() => getOrderListLength())
        (async () => {
          try {
            const emailAddress = await AsyncStorage.getItem("emailAddress")
            const passwordDetails = await AsyncStorage.getItem("passwordDetails")
            if(emailAddress, passwordDetails){
              console.log("Stored Data")
              console.log({emailAddress, passwordDetails})
              setEmailAddress(emailAddress)
              setPasswordDetails(passwordDetails)
              setLoading(false)
              setShowForm(true)                   
            }else{
              setLoading(false)
              setShowForm(true)
            }
          }
          catch(err) {
            setEmailAddress(null)
            setPasswordDetails(null)
            setLoading(false)
            setShowForm(true)
          }
        })()
    }, [])

    React.useEffect(() => {

      if(emailAddress && passwordDetails) {
        keyvalue = emailAddress.substring(0, emailAddress.indexOf("@"))
        setKeyValue(keyvalue)
        setLoginEmail(emailAddress)
        setLoginDb(keyvalue.split('+')[0])
        setLocId(keyvalue.split('+')[1])
        setLoginPassword(passwordDetails)
      }
    }, [emailAddress, passwordDetails])

    const doLogin = async () => {
      setLoading(true)
      setShowForm(false)
      console.log({
        emailAddress,
        passwordDetails,
        keyvalue,
        login_db,
        login_email,
        login_password,
        login_locid,
      })
      handleLogin()
      .then(async () => {
        try{
          console.log("Logged In...")
          await AsyncStorage.setItem("emailAddress", emailAddress)
          await AsyncStorage.setItem("passwordDetails", passwordDetails)
          getOrderListLength()
        }
        catch(err) {
          getOrderListLength()
        }
      })
      .catch(async (err) => {
        console.log("Logged Failed...")
        try {
          if(isConnected){
            setLoading(false)
            setShowForm(true)
          }
          else {
            getOrderListLength()
          }
        }
        catch(err) {}
      })
    }

    const styles = StyleSheet.create({
      input: {
        height: 40,
        width: 300,
        margin: 12,
        borderWidth: 1,
        padding: 10,
      }
    });

    const WelcomeScreen = () => {
      return (
          <View style={{flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "whitesmoke", heght: "100%", width: "100%"}}>
            <Text>WELCOME TO IMREKE MDS</Text>
            {!isConnected && <Text>No Internet Connection</Text>}
            <TextInput
              style={styles.input}
              onChangeText={text => setEmailAddress(text)}
              placeholder={"Email Address"}
              value={emailAddress}
            />
            <TextInput
              style={styles.input}
              onChangeText={text => setPasswordDetails(text)}
              placeholder={"Password"}
              value={passwordDetails}
            />
            <Button
              onPress={() => doLogin()} 
              title="Login"
              color="black"
            />
          </View>
      )
    }

    return (
        <>
            <StatusBar hidden={true} />
            <View style={{flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "grey"}}>                
                {isLoading && <Bars size={22} color="white" />}
                {!isLogin && showForm && <WelcomeScreen />}
                {!isLoading && isSlideStarted && slide && (
                    <ImageBackground source={{uri: `${slide}`}} resizeMode="cover" style={{flex: 1, justifyContent: "center", height: "100%", width: "100%"}} />
                )}
            </View>
        </>
    )
}

export default App;
