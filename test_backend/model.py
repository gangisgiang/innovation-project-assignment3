import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
import joblib
from pathlib import Path


class SimpleModel:
    def __init__(self):
        self.model = LogisticRegression()

    def train(self):
        df = pd.read_csv('train.csv')
        data = df.where((pd.notnull(df)), '')
        X = data['text']
        Y = data['label']
        feature_extraction = CountVectorizer(min_df=1, stop_words='english', lowercase=True)
        pipeline = make_pipeline(feature_extraction, LogisticRegression())
        Y = Y.astype('int')
        pipeline.fit(data['text'], Y)

        model_path = Path(__file__).resolve().parent / 'simple_model.pkl'
        joblib.dump(pipeline, model_path)

        custom_input = [
            "hey guys ,  we ' re talking to a contractor ( s ) that can build us a weather station  ( hopefully very quickly ) for placement in sacramento , california . for a  variety of legal , contractor , and operational reasons , i need to confirm some  of the following requirements as soon as possible so we can proceed :  a ) you need rainfall , snowfall , and temperature measurement from one ,  high - accuracy commercially available weather station .  b ) you need a daily feed of this data to enron ' s weather desk : does this  mean one data dump at a set time per day ? alternatively , will you need to  check the data real - time , perhaps at varying and multiple times during the  day ?  c ) we will be installing this station near sacramento , california : we will  need to know exactly what areas in / near sacramento are suitable for the site  of the weather station . ( what again was the name of the town that you  mentioned mark ? ) in the interest of time , i recommend that your weather  expert accompany our landman to select the site , which will allow our landman  to more quickly lease and install the station .  d ) you desire to have some independent security measures to deter or detect  tampering . i suggest given the very short time fuse , that we first install  the station and then develop security measures .  e ) we will feed the data directly to the enron weather desk . will any other  parties require real - time access to this data ?  please forward responses directly to : chris clark / na / enron and myself .  thanks , scott"
        ]
        prediction = pipeline.predict(custom_input)
        if (prediction[0] == 0):
            print("Test is Ham mail")
        else:
            print("Test is Spam mail")

        custom_input = [
            "subject looking for a new job professional . effective . 100 guaranteed . visit us at www . stopsendingresumes . net career controls inc . p . o . box 42108 cincinnati oh 45242 this e - mail message is an advertisement and or solicitation ."
        ]
        prediction = pipeline.predict(custom_input)
        if (prediction[0] == 0):
            print("Test is Ham mail")
        else:
            print("Test is Spam mail")

    
    def predict(self, input_text):
        model_path = Path(__file__).resolve().parent / 'simple_model.pkl'
        pipeline = joblib.load(model_path)
        prediction = pipeline.predict([input_text])
        return int(prediction[0])

if __name__ == "__main__":
    model = SimpleModel()
    model.train()