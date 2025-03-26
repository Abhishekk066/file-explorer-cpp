#include <iostream>
using namespace std;

class MyCube {
private:
    int area, volume, num;
public:
    void input() {
       cout << "Enter Number: ";
       cin >> num;
    }

    friend void calulate(MyCube);
};

void calulate(MyCube c) {
    c.area = 6 * c.num * c.num;
    c.volume = c.num * c.num * c.num;

    cout << "Area of cube = " << c.area << endl;
    cout << "Volume of volume = " << c.volume << endl;
}

int main() {
    MyCube cube;
    cube.input();
    calulate(cube);
    return 0;
}


