#include <iostream>
using namespace std;

int checkRev(int num){
    int rev = 0, rem;

    while(num != 0){
        rem = num % 10;
        rev = rev * 10 + rem;
        num /= 10;
    }
    return rev;
}

int main() {
    int num, num2, res;
    cout << "Enter Number: ";
    cin >>  num;
    if(num == 0) {
       cout << "Invalid number" << endl;
       return 0;
    }
    num2 = num;
    res = checkRev(num);
    if(res == num2) {
       cout << num2 << " is Pelendrome Number" << endl;
    } else {
       cout << num2 << " is not a Pelendrome Number" << endl;
    }

    return 0;
}
