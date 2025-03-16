#include <iostream>
using namespace std;

int *fact(int *num){
    int *r = new int(1);
    for (int i = *num; i > 0; i--)
    {
        *r *= i;
    }
    return r;
}

int main(){
    int num;
    int *result;

    cout << "Enter Number: ";
    cin >> num;

    result = fact(&num);
    cout << "Factorial of " << num << " is " << *result << endl;
    delete result;

    return 0;
}
