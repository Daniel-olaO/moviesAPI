const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moviesSchema = new Schema({
    title: String,
    year: Number,
    type: String,
    genres:Array,
    countries:Array
});


module.exports = class MoviesDB{
    constructor(connectionString){
        this.connectionString = connectionString;
        this.Movies = null
    }
    
    initailize(){
        return new Promise((resolve, reject)=>{
            let db = mongoose.createConnection(this.connectionString,{
                useUnifiedTopology: true
            });
            db.on('error',err=>{
                reject(err)
            });
            db.once('open',()=>{
                this.Movies = db.model("movies", moviesSchema);
                resolve('connected to mongo successfully');
            })
        })
    }
    async addNewMovie(data){
        let newMovie = new this.Movies(data);
        await newMovie.save();

        return `Movie ${newMovie._id} saved`
    }
    getAllMovies(page, perPage){
        if(+page && +perPage){
            return this.Movies.find().sort({_id: +1}).skip((page - 1) * +perPage).limit(+perPage).exec();
        }
        
        return Promise.reject(new Error('page and perPage query parameters must be present'));
    }
    getMovieById(id){
        return new Promise((resolve, reject)=>{
            this.Movies.findOne({_id: id})
            .exec()
            .then((movie)=>{
                resolve(movie);
            })
            .catch((err)=>{
                reject(err);
            });
        });
    }
    async updateMovieById(data, id){
        await this.Movies.updateOne({_id: id}, { $set: data }).exec();
        return `movie ${id} successfully updated`;
    }

    async deleteMovietById(id){
        await this.Movies.deleteOne({_id: id}).exec();
        return `movie ${id} successfully deleted`;
    }
}