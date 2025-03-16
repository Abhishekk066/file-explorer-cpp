#include <iostream>
using namespace std;

int *max(int *x, int *y){
    return (*x > *y) ? x : y;
}

int main(){
    int a, b, *r;
    cout << "Enter first number: ";
    cin >> a;
    cout << "Enter second number: ";
    cin >> b;

    r = max(&a, &b);
    cout << "Maximum number is = " << *r << endl;
    return 0;
}
