export class SqlMatcher {

    constructor() {}

    execute(data: string): 'insert' | 'update' | null {
        if (data.match(/INSERT/i)) {
            console.log('Insert detectado:');
            return 'insert';
        }
    
        if (data.match(/UPDATE/i)) {
            console.log('Update detectado:');
            return 'update';
        }
        return null;
    }

}