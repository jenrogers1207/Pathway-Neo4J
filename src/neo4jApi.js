require('file?name=[name].[ext]!../node_modules/neo4j-driver/lib/browser/neo4j-web.min.js');
var Movie = require('./models/Movie');
var MovieCast = require('./models/MovieCast');
var _ = require('lodash');

var neo4j = window.neo4j.v1;
var driver = neo4j.driver("bolt://localhost", neo4j.auth.basic("neo4j", "string"));

function searchMovies(queryString) {
    var session = driver.session();
    return session
        .run(
            'MATCH (movie:Movie) \
      WHERE movie.title =~ {title} \
      RETURN movie', { title: '(?i).*' + queryString + '.*' }
        )
        .then(result => {
            session.close();
            return result.records.map(record => {
                return new Movie(record.get('movie'));
            });
        })
        .catch(error => {
            session.close();
            throw error;
        });
}

function getMovie(title) {
    var session = driver.session();
    return session
        .run(
            "MATCH (movie:Movie {title:{title}}) \
      OPTIONAL MATCH (movie)<-[r]-(person:Person) \
      RETURN movie.title AS title, \
      collect([person.name, \
           head(split(lower(type(r)), '_')), r.roles]) AS cast \
      LIMIT 1", { title })
        .then(result => {
            session.close();

            if (_.isEmpty(result.records))
                return null;

            var record = result.records[0];
            return new MovieCast(record.get('title'), record.get('cast'));
        })
        .catch(error => {
            session.close();
            throw error;
        });
}

function getGraph() {
    var session = driver.session();

    return session.run(
            /*
            'MATCH (t:Taxon)<-[:TAGGED]-(p:Protien) \
    RETURN t.name AS taxon, collect(p.name) AS nodes \
    LIMIT {limit}', { limit: 100 }*/
            'MATCH(n:Protein) \
            RETURN collect(n)'
        )
        .then(results => {

            session.close();
            var nodes = [],
                rels = [],
                i = 0;
            //  console.log(results.records[0]._fields)
            let test = results.records[0]._fields[0].map(res => {
                //console.log(res['properties']);
                return res['properties'];
            });

            /*
            results.records.forEach(res => {
                // nodes.push({ title: res.get('movie'), label: 'movie' });
                var target = i;
                i++;
                
                                res.get('cast').forEach(name => {
                                    var actor = { title: name, label: 'actor' };
                                    var source = _.findIndex(nodes, actor);
                                    if (source == -1) {
                                        nodes.push(actor);
                                        source = i;
                                        i++;
                                    }
                                    rels.push({ source, target })
                                })
                                
            });*/

            // return { nodes, links: rels };
            console.log(test);
            return test;
        });

}

function addNode(name, taxon) {
    let session = driver.session();
    return session.run(
        // 'CREATE(n:Protein {name: ' + name.toString() + ', taxonName: ' + taxon.toString() + '})'
        'CREATE(n:Protein {name: " ' + name + '", taxonName: " ' + taxon + ' " })'
    ).then(results => {
        console.log(results);
        session.close();
    })
}

exports.searchMovies = searchMovies;
exports.getMovie = getMovie;
exports.getGraph = getGraph;
exports.addNode = addNode;