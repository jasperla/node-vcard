var vCard,
    vCardString,
    assert = require('assert-plus'),
    fs = require('fs'),
    vCard = require('../vcard');

testAllCardsInFolder = function (folderPath) {
    if (!fs.existsSync(folderPath)) {
        return
    }

    fs.readdirSync(
        folderPath
    ).filter(function (path) {
        return path.match(/.vcf$/)
    }).forEach(function (path) {
        describe(path, function(){
            var vCardString = fs.readFileSync(folderPath + path, {encoding: 'ascii'});

            it('is parsed', function(done){
                var json = vCard.readData(vCardString);
                done()
            })
        })

    })
}

describe('VCard', function(){

    testAllCardsInFolder('./spec/');
    testAllCardsInFolder('./spec/private-vcards/');
    
});
