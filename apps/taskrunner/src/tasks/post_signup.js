module.exports = async (payload, helpers) => {
    //Apply "SignupAdmin" = 'ROLMA1' role to the user after domain registration
    const qry = `INSERT INTO ac.userrole VALUES ($1,'ROLMA1','PUBLIC','PUBLIC',$2,'A','Y',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;
    let subd = this.db.db_qry_execute(qry,[clntinf.id,clntinf.siteid])
                .then((e) => console.log('DB update success'))
                .catch((e)=> console.error('update error table -> signup failure~default roleassgingment failed~userid ${clntinf.id}'));
                //Implement logger here
};